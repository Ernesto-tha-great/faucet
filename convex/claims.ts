import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createClaim = mutation({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const { address } = args;
    const timestamp = Date.now();
    await ctx.db.insert("claims", { address, timestamp });
  },
});

export const getLastClaim = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const { address } = args;
    const claims = await ctx.db
      .query("claims")
      .filter((q) => q.eq(q.field("address"), address))
      .order("desc")
      .first();
    return claims;
  },
});
