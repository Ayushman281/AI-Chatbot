CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT,
    amount REAL,
    date TEXT,
    region TEXT
);

INSERT INTO sales (product, amount, date, region) VALUES
('Widget', 120.5, '2024-06-01', 'North'),
('Gadget', 99.9, '2024-06-02', 'South'),
('Widget', 130.0, '2024-06-03', 'East');
