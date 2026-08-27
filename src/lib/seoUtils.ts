export function getRecipeImage(recipe: any, siteUrl: string): string {
  let img = recipe?.socialImage || recipe?.mainImage || recipe?.coverImage || recipe?.thumbnailUrl;
  if (!img) {
    return `${siteUrl}/logo.png`;
  }
  if (!img.startsWith('http')) {
    img = img.startsWith('/') ? `${siteUrl}${img}` : `${siteUrl}/${img}`;
  }
  return img;
}

export function getRecipeTitle(recipe: any): string {
  return recipe?.seoTitle || recipe?.title || '';
}

export function getRecipeDescription(recipe: any): string {
  const desc = recipe?.seoDescription || recipe?.shortDescription || recipe?.description || '';
  return desc.substring(0, 160);
}
