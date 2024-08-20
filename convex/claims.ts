import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createClaim = mutation({
  args: { address: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const { address, token } = args;
    const timestamp = Date.now();
    await ctx.db.insert("claims", { address, token, timestamp });
  },
});

export const getLastClaim = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const claim = await ctx.db
      .query("claims")
      .filter((q) => q.eq(q.field("address"), args.address))
      .order("desc")
      .first();
    return claim;
  },
});
