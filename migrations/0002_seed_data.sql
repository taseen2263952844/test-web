-- Cloudflare D1 Migration: 0002_seed_data.sql
-- Default settings and authentic British menu items for Restaurant Starter

-- Seed Default Settings
INSERT OR IGNORE INTO restaurant_settings (
  id, name, tagline, description, logo_url, hero_url, address, phone, email, currency, delivery_enabled, pickup_enabled, delivery_charge, min_order_amount, free_delivery_threshold, opening_hours
) VALUES (
  'default',
  'The Heritage English Kitchen',
  'Hearty Artisan British Fare & Seasonal Comforts',
  'Rooted in authentic English tavern traditions, we prepare line-caught North Sea fish, dry-aged British steaks, and timeless seasonal classics made fresh with locally sourced ingredients.',
  '/src/assets/images/food_craft_burger_1792585736095.jpg',
  '/src/assets/images/hero_restaurant_dining_1792585735418.jpg',
  '14 High Street, Winchester, Hampshire, SO23 9JX',
  '+44 1962 841234',
  'orders@heritagekitchen.co.uk',
  '£',
  1,
  1,
  3.50,
  15.00,
  45.00,
  'Mon-Fri: 12:00 - 22:00 | Sat-Sun: 11:30 - 22:30'
);

-- Seed Categories
INSERT OR IGNORE INTO menu_categories (id, name, slug, display_order, is_active) VALUES
('cat_starters', 'Starters & Small Plates', 'starters-small-plates', 1, 1),
('cat_mains', 'Pub Classics & Mains', 'pub-classics-mains', 2, 1),
('cat_burgers', 'Artisan Burgers & Grills', 'artisan-burgers-grills', 3, 1),
('cat_sides', 'Rustic Sides', 'rustic-sides', 4, 1),
('cat_desserts', 'English Puddings', 'english-puddings', 5, 1),
('cat_drinks', 'Craft Ales & Soft Drinks', 'craft-ales-soft-drinks', 6, 1);

-- Seed Menu Items
INSERT OR IGNORE INTO menu_items (id, category_id, name, slug, description, price, image_url, is_active, is_available, dietary_flags, sort_order) VALUES
-- Starters
(
  'item_scotch_egg',
  'cat_starters',
  'Traditional Cumberland Scotch Egg',
  'traditional-cumberland-scotch-egg',
  'Soft-yolked free-range egg wrapped in seasoned Cumberland sausage meat and golden panko crumb, served with spiced apple chutney.',
  7.50,
  '',
  1, 1, 'Local Free Range', 1
),
(
  'item_mushrooms_toast',
  'cat_starters',
  'Wild Mushrooms on Sourdough',
  'wild-mushrooms-on-sourdough',
  'Pan-roasted chestnut & king oyster mushrooms in a rich garlic & thyme cream on toasted Hampshire sourdough.',
  8.25,
  '',
  1, 1, 'Vegetarian', 2
),
(
  'item_soup_day',
  'cat_starters',
  'Roasted Butternut & Sage Soup',
  'roasted-butternut-sage-soup',
  'Slow-roasted butternut squash blended with fresh sage, toasted pumpkin seeds, and warm buttered farmhouse bread.',
  6.95,
  '',
  1, 1, 'Vegetarian,Gluten-Free Option', 3
),

-- Mains
(
  'item_fish_chips',
  'cat_mains',
  'Beer-Battered North Sea Cod & Chips',
  'beer-battered-north-sea-cod-chips',
  'Sustainably caught prime cod fillet in crisp ale batter, served with triple-cooked chips, crushed minted garden peas, and homemade caper tartare sauce.',
  17.95,
  '/src/assets/images/food_fish_chips_1792585735921.jpg',
  1, 1, 'Chef Signature', 1
),
(
  'item_sunday_roast',
  'cat_mains',
  'Slow-Roasted British Sirloin Roast',
  'slow-roasted-british-sirloin-roast',
  '28-day aged carved sirloin with towering crisp Yorkshire pudding, beef-dripping roast potatoes, honeyed heritage parsnips, and 48-hour bone marrow gravy.',
  19.50,
  '/src/assets/images/food_sunday_roast_1792585736831.jpg',
  1, 1, 'Traditional Sunday Classic', 2
),
(
  'item_shepherds_pie',
  'cat_mains',
  'Braised Lamb Shepherd''s Pie',
  'braised-lamb-shepherds-pie',
  'Slow-braised British lamb shoulder with rosemary, root vegetables, topped with browned buttery potato mash and mature cheddar crust.',
  16.50,
  '',
  1, 1, 'Hearty Warm Favorite', 3
),
(
  'item_veggie_wellington',
  'cat_mains',
  'Butternut & Spinach Wellington',
  'butternut-spinach-wellington',
  'Roasted butternut squash, wild mushrooms, baby spinach, and cranberry duxelles wrapped in golden puff pastry with red onion gravy.',
  15.95,
  '',
  1, 1, 'Vegetarian', 4
),

-- Burgers & Grills
(
  'item_heritage_burger',
  'cat_burgers',
  'The Heritage Dry-Aged Beef Burger',
  'the-heritage-dry-aged-beef-burger',
  'Two 100% British dry-aged beef patties, melted vintage English cheddar, beer-caramelized shallots, crisp gem lettuce, and house burger sauce in a glazed brioche bun with rustic chips.',
  16.50,
  '/src/assets/images/food_craft_burger_1792585736095.jpg',
  1, 1, 'Best Seller', 1
),
(
  'item_chicken_burger',
  'cat_burgers',
  'Buttermilk Fried Chicken Burger',
  'buttermilk-fried-chicken-burger',
  'Marinated chicken breast in crispy herb coating, pickled red cabbage slaw, and roasted garlic aioli in toasted brioche.',
  15.25,
  '',
  1, 1, 'Customer Choice', 2
),

-- Sides
(
  'item_chips',
  'cat_sides',
  'Triple-Cooked Sea Salt Chips',
  'triple-cooked-sea-salt-chips',
  'Hand-cut Maris Piper potatoes, crisp exterior with fluffy interior, seasoned with Maldon sea salt.',
  4.50,
  '',
  1, 1, 'Vegetarian', 1
),
(
  'item_truffle_chips',
  'cat_sides',
  'Truffle & Parmesan Chips',
  'truffle-parmesan-chips',
  'Hand-cut chips tossed in black truffle oil, aged English parmesan, and fresh chopped parsley.',
  5.75,
  '',
  1, 1, 'Vegetarian', 2
),
(
  'item_greens',
  'cat_sides',
  'Buttered Seasonal Greens',
  'buttered-seasonal-greens',
  'Tenderstem broccoli, fine green beans, and garden peas tossed in herb garlic butter.',
  4.25,
  '',
  1, 1, 'Vegetarian,Gluten-Free', 3
),

-- Desserts
(
  'item_sticky_toffee',
  'cat_desserts',
  'Warm Sticky Toffee Pudding',
  'warm-sticky-toffee-pudding',
  'Classic date sponge drenched in bubbling rich butterscotch caramel sauce, crowned with Cornish clotted cream vanilla bean ice cream and candied pecans.',
  7.95,
  '/src/assets/images/food_sticky_toffee_1792585737424.jpg',
  1, 1, 'Signature Dessert', 1
),
(
  'item_apple_crumble',
  'cat_desserts',
  'Bramley Apple & Blackberry Crumble',
  'bramley-apple-blackberry-crumble',
  'Spiced orchard Bramley apples and hedgerow blackberries baked with buttery oat crumble topping, served with warm vanilla custard.',
  7.50,
  '',
  1, 1, 'Vegetarian', 2
),

-- Drinks
(
  'item_english_ale',
  'cat_drinks',
  'Wessex Pale Ale (500ml Bottle)',
  'wessex-pale-ale-500ml',
  'Crisp, refreshing English pale ale brewed with Goldings hops and Hampshire malt (4.4% ABV).',
  5.50,
  '',
  1, 1, 'Alcohol 18+', 1
),
(
  'item_elderflower_press',
  'cat_drinks',
  'Sparkling English Elderflower Pressé (330ml)',
  'sparkling-english-elderflower-presse',
  'Handpicked British elderflowers blended with sparkling spring water and fresh lemon juice.',
  3.75,
  '',
  1, 1, 'Soft Drink', 2
),
(
  'item_ginger_beer',
  'cat_drinks',
  'Fiery Traditional Ginger Beer (330ml)',
  'fiery-traditional-ginger-beer',
  'Naturally brewed cloudy ginger beer with a zesty lemon kick.',
  3.75,
  '',
  1, 1, 'Soft Drink', 3
);
