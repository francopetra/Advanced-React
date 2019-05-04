const bcryp = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Mutations = {
    async createItem(parent, args, ctx, info) {
        // TODO: Check if they are logged in
        const item = await ctx.db.mutation.createItem({
            data: {
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
    deleteItem(parent, args, ctx, info) {
        const where = {id: args.id };
        //1. find item 2. check if they own item 3. Delete it
        const item = ctx.db.query.item({where}, `{ id title}`);
        return ctx.db.mutation.deleteItem({ where }, info)
    },
    async signup(parent, args, ctx, info) {
        args.email = args.email.toLowerCase();
        const password = await bcryp.hash(args.password, 10);
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
    }
};

module.exports = Mutations;
