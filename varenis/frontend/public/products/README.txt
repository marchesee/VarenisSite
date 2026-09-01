Drop your product photos here. Each product shows a gallery: the first image
is the main/hero shot, the rest become clickable thumbnails.

NAMING: <product-id>-<number>.jpg, numbered in the order you want them shown.
The site currently looks for -1 through -4 per product; -1 is the main image.
Any slot without a file is simply skipped (no broken images), so you can use
as few or as many as you have.

  leopard-tee-black-1.jpg, leopard-tee-black-2.jpg, ...
  leopard-tee-white-1.jpg, ...
  leopard-graphic-tee-white-1.jpg, ...
  sweatshirt-black-1.jpg, ...
  sweatshirt-white-1.jpg, ...
  sweatpants-black-1.jpg, ...

Tips:
- -1 is the hero (shown on the shop tile + main modal view). Make it your best.
- Want more than 4 images on a product? Add more slots in that product's
  `images` array in frontend/src/data/products.ts (e.g. add "...-5.jpg").
- Square-ish images look best (tiles are 3:4). ~1000x1200px, under ~500KB each.
- Using .png? Change the extension in the `images` array to match.
