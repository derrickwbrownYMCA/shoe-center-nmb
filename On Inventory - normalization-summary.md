# On Inventory Normalization Summary

- Source rows: `1182`
- Waterproof rows: `135`
- Wide rows: `109`
- Gender from description: `1086`
- Gender from size-group fallback: `96`

## Color normalization methods

- `multi_word_split`: `14`
- `pipe_normalized`: `790`
- `single_word_duplicated`: `77`
- `two_word_split`: `301`

## Notes

- Colors were normalized into the `XX | YY` pattern.
- Single-word colors were duplicated into `Color | Color` so they still follow the requested format.
- Three-word colors were normalized as `first words | last word` for review.
- Waterproof was extracted into its own attribute column and not removed from the source SKU.
- Wide was inferred from the size field when `W` or `Wide` appeared after the size.
- Some gender values required fallback to the size group because the description did not include Men/Women.
