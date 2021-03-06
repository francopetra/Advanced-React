const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils')

const Mutations = {
    async createItem(parent, args, ctx, info) {
        if(!ctx.request.userId) {
            throw new Error('You must be logged in');
        }
        const item = await ctx.db.mutation.createItem({
            data: {
                //This is the way we create relationships in prisma
                user: {
                    connect: {
                        id: ctx.request.userId
                    }
                },
                ...args
            }
        }, info);
        return item;
    },
    
    updateItem(parent, args, ctx, info) {
        const updates = {...args};
        delete updates.id;
        return ctx.db.mutation.updateItem({
            data: updates,
            where: {
                id: args.id
            },
        }, info);   
    },
    async deleteItem(parent, args, ctx, info) {
        const where = { id: args.id };
        //1. find item 2. check if they own item 3. Delete it
        const item = await ctx.db.query.item({where}, `{ id title user {id} }`);
        const ownsItem = item.user.id === ctx.request.userId;
        const hasPermissions = ctx.request.user.permissions.some
                (permission => ['ADMIN', 'ITEMDELETE'].includes(permission));
        if(!ownsItem && hasPermissions) {
            throw new Error('You cannot perform that action')
        }
        return ctx.db.mutation.deleteItem({ where }, info)
    },
    async signup(parent, args, ctx, info) {
        args.email = args.email.toLowerCase();
        const password = await bcrypt.hash(args.password, 10);
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: {set: ['USER']},
            }
        }, info);
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        // Set jwt as a cookie
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return user;
    },
    async signin(parent, {email, password}, ctx, info) {
        const user = await ctx.db.query.user({ where: { email }});
        if(!user){
            throw new Error(`No such user found for email ${email}`);        
        }
        const valid = await bcrypt.compare(password, user.password);
        if(!valid) {
            throw new Error('Invalid password');
        }
        const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        return user;
    },
    signout(parent, args, ctx, info) {
        ctx.response.clearCookie('token')
        return { message: 'Goodbye!' };
    },
    async requestReset(parent, args, ctx, info) {
      //Is user? 
      const user = await ctx.db.query.user({ where: {email: args.email}})
      if(!user){
        throw new Error(`No such user found for email ${args.email}`);  
      }
      //Set reset token 
      const randomBytesPromise = promisify(randomBytes) 
      const resetToken = (await randomBytesPromise(20)).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000
      const res = await ctx.db.mutation.updateUser({
          where: {email: args.email},
          data: {resetToken, resetTokenExpiry}
      })
      
      const mailRes = await transport.sendMail({
          from: 'franco.petraz@gmail.com',
          to: user.email,
          subject: 'Password reset token',
          html: makeANiceEmail(`Your Password is here \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
          Cliick Here To Reset</a>`)
      })

      return { message: 'Success'} 
    },
    async resetPassword(parent, args, ctx, info) {
        // Check if pwd match 
        if(args.password !== args.confirmPassword) {
            throw new Error("Pass doesn't match")
        }

        // Check if legit token // Check if token not expired
        const [user] = await ctx.db.query.users({
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000
            }
        })

        if(!user) {
            throw new Error("This token is either expired or invalid")
        }
        // Save new pwd and generate y save jwt
        const password = await bcrypt.hash(args.password, 10)
        const updateUser = await ctx.db.mutation.updateUser({
            where: {email: user.email},
            data: {
                password,
                resetToken: null,
                resetTokenExpiry: null
            }
        })
        const token = jwt.sign({ userId: updateUser.id },
            process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 24 * 365
        })
        return updateUser;
    },
    async updatePermissions(parent, args, ctx, info) {
        if (!ctx.request.userId) {
            throw new Error('You must be logged in');
        }
    const currentUser = await ctx.db.query.user({
                where: {
                    id: ctx.request.userId,
                },
            }, info);
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    return ctx.db.mutation.updateUser({
        data: {
            permissions: {
                // We use the set since we are using an enum in the datmodel
                set: args.permissions
            },
        },
        where: {
            id: args.userId
        }
    }, info);
    }
};

module.exports = Mutations;
