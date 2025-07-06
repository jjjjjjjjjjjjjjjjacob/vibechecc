"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  computeUserDisplayName: () => computeUserDisplayName,
  getUserAvatarUrl: () => getUserAvatarUrl,
  getUserInitials: () => getUserInitials,
  placeholder: () => placeholder,
  seo: () => seo
});
module.exports = __toCommonJS(index_exports);
function computeUserDisplayName(user) {
  if (!user) {
    return "Unknown User";
  }
  if (user.username?.trim()) {
    return user.username.trim();
  }
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();
  if (firstName || lastName) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }
  if (user.full_name?.trim()) {
    return user.full_name.trim();
  }
  return "Unknown User";
}
function getUserAvatarUrl(user) {
  if (!user) {
    return void 0;
  }
  if (user.image_url) {
    return user.image_url;
  }
  if (user.profile_image_url) {
    return user.profile_image_url;
  }
  return void 0;
}
function getUserInitials(user) {
  const displayName = computeUserDisplayName(user);
  const parts = displayName.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return displayName.substring(0, 2).toUpperCase();
}
var seo = ({
  title,
  description,
  keywords,
  image
}) => {
  const tags = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:creator", content: "@tannerlinsley" },
    { name: "twitter:site", content: "@tannerlinsley" },
    { name: "og:type", content: "website" },
    { name: "og:title", content: title },
    { name: "og:description", content: description },
    ...image ? [
      { name: "twitter:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "og:image", content: image }
    ] : []
  ];
  return tags;
};
function placeholder() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  computeUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
  placeholder,
  seo
});
