# Sample Product Pilot Table

This is a first-pass working table for the product pilot.

Important:

- product names below are placeholders for planning unless confirmed from live inventory
- the structure matters more than the exact SKU facts at this stage
- once real product exports are available, this table can become the basis for the actual pilot import file

## Pilot Mix

- 5 `On` women's products
- 3 `On` men's products
- 3 legacy comfort products
- 3 dance products

## Table

| Group | Priority | Brand | Gender | Product Type | Sample Product | Use Case | True To Size | Width Notes | Arch Support | Cushioning | Dance Ready | Pickup Eligible | Style Generation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| On Women | Flagship | On | women | Women's Running Shoes | On Cloudsurfer Next | running, walking, travel | true_to_size | regular | 3 | 5 | false | true | modern | Strong women's performance/lifestyle candidate |
| On Women | Flagship | On | women | Women's Everyday Performance Shoes | On Cloud 6 | walking, travel, casual | true_to_size | regular | 3 | 4 | false | true | modern | Good crossover product for lifestyle shoppers |
| On Women | Flagship | On | women | Women's Running Shoes | On Cloudmonster | running, walking | runs_large | regular | 3 | 5 | false | true | modern | High-cushion performance-led storytelling |
| On Women | Flagship | On | women | Women's Waterproof Performance Shoes | On Cloud 5 Waterproof | travel, walking, weather | true_to_size | regular | 3 | 4 | false | true | modern | Useful for practical filtering and search |
| On Women | Flagship | On | women | Women's Performance Lifestyle Shoes | On The Roger | casual, travel, walking | true_to_size | regular | 2 | 3 | false | true | modern | Helps broaden On beyond pure running |
| On Men | Flagship | On | men | Men's Everyday Performance Shoes | On Cloud 6 | walking, travel, casual | true_to_size | regular | 3 | 4 | false | true | modern | Men's visibility growth product |
| On Men | Flagship | On | men | Men's Running Shoes | On Cloudrunner | running, walking | true_to_size | regular | 4 | 4 | false | true | modern | Good comfort/performance bridge |
| On Men | Flagship | On | men | Men's Waterproof Performance Shoes | On Cloud 5 Waterproof | travel, weather, casual | true_to_size | regular | 3 | 4 | false | true | modern | Good visitor and travel story |
| Legacy Comfort | Core | Birkenstock | women | Women's Comfort Sandals | Birkenstock Arizona | sandal, walking, casual | true_to_size | wide | 4 | 3 | false | true | crossover | Legacy comfort authority product |
| Legacy Comfort | Core | Dansko | women | Women's Comfort Clogs | Dansko Professional | work, all_day_standing | runs_small | regular | 4 | 3 | false | true | legacy | Strong work/comfort credibility product |
| Legacy Comfort | Core | New Balance | men | Men's Comfort Walking Shoes | New Balance 990 | walking, travel, casual | true_to_size | wide | 4 | 4 | false | true | crossover | Strong men's comfort anchor |
| Dance | Specialty | Very Fine | women | Dance Shoes | Signature Shag Sandal | dance | true_to_size | regular | 2 | 2 | true | true | crossover | Good dedicated dance test case |
| Dance | Specialty | Capezio | women | Dance Shoes | Ballroom Practice Heel | dance | true_to_size | narrow | 2 | 2 | true | true | legacy | Strong specialty PDP requirements |
| Dance | Specialty | Very Fine | men | Dance Shoes | Men's Dance Oxford | dance | true_to_size | regular | 2 | 2 | true | true | crossover | Important for dance audience breadth |

## How To Use This Table

Use this table to validate:

- which metafields are easy to populate
- which values need tighter standardization
- which products deserve special PDP modules
- which products belong in flagship homepage merchandising
- which products need dance-specific or comfort-specific page treatments

## Likely Merchandising Outcomes

Expected homepage and collection impacts:

- `On Women` should likely receive strong homepage and women's collection placement
- `On Men` should be visible enough to support the men's growth goal
- `Legacy Comfort` should preserve the store's trust and heritage positioning
- `Dance` should remain specialized, respected, and easy to find without dominating the main pitch

## Next Translation Step

This markdown table should later become:

- a spreadsheet tab
- a Shopify-ready sample import sheet
- the first real pilot dataset for QA
