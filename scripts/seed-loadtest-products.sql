-- Minimal catalog for load testing (satisfies order_items -> products FK).
INSERT INTO categories (id, name, slug, display_order, is_active)
VALUES ('cat-lt', 'Load Test', 'load-test', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, category_id, name, unit, price, srp, sku, stock_qty, is_active)
SELECT
  'p-' || LPAD(g::text, 3, '0'),
  'cat-lt',
  'Load Test Product ' || g,
  'pc',
  (5 + g)::numeric,
  (8 + g)::numeric,
  'SKU-' || LPAD(g::text, 3, '0'),
  1000000,
  TRUE
FROM generate_series(1, 30) AS g
ON CONFLICT (id) DO NOTHING;

SELECT 'products seeded='||count(*) FROM products;
