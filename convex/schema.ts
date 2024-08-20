import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  claims: defineTable({
    address: v.string(),
    token: v.string(),
    timestamp: v.number(),
  }),
});
