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
    }
};

module.exports = Mutations;
