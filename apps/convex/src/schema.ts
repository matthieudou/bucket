import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  tiles: defineTable({
    ownerId: v.id("users"),
    type: v.literal("image"),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    size: v.object({
      w: v.number(),
      h: v.number(),
    }),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
