
-- First, drop everything if it exists
DROP TABLE IF EXISTS playlist_track CASCADE;
DROP TABLE IF EXISTS inv_line CASCADE;
DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS trk CASCADE;
DROP TABLE IF EXISTS albm CASCADE;
DROP TABLE IF EXISTS playlist CASCADE;
DROP TABLE IF EXISTS employe CASCADE;
DROP TABLE IF EXISTS artist CASCADE;
DROP TABLE IF EXISTS media_type CASCADE;
DROP TABLE IF EXISTS genre CASCADE;

-- Now create tables in correct order

CREATE TABLE genre
(
    id INT NOT NULL,
    genre_type VARCHAR(120),
    col4 VARCHAR(500),
    CONSTRAINT genre_pkey PRIMARY KEY (id)
);

CREATE TABLE media_type
(
    TypeID INT NOT NULL,
    type_desc VARCHAR(120),
    col5 BOOLEAN,
    CONSTRAINT media_type_pkey PRIMARY KEY (TypeID)
);

CREATE TABLE artist
(
    ArtistIdentifier INT NOT NULL,
    NM VARCHAR(120) NULL,
    ctry VARCHAR(40),
    col2 VARCHAR(100),
    CONSTRAINT artist_pkey PRIMARY KEY (ArtistIdentifier)
);

CREATE TABLE employe
(
    EmpID INT NOT NULL,
    surname VARCHAR(20),
    given_name VARCHAR(20),
    JobTitle VARCHAR(30) NOT NULL,
    manager_id INT,
    DOB TIMESTAMP,
    StartDate TIMESTAMP,
    location VARCHAR(70),
    municipality VARCHAR(40),
    province VARCHAR(40),
    nation VARCHAR(40),
    post_code VARCHAR(10),
    telephone VARCHAR(24),
    facsimile VARCHAR(24),
    electronic_mail VARCHAR(60) NULL,
    col3 NUMERIC(10,2),
    CONSTRAINT employee_pkey PRIMARY KEY (EmpID)
);

CREATE TABLE albm
(
    AlbumId INT NOT NULL,
    ttle VARCHAR(160),
    a_id INT,
    col1 INT,
    CONSTRAINT album_pkey PRIMARY KEY (AlbumId)
);

CREATE TABLE customer
(
    cust_id INT NOT NULL,
    F_NAME VARCHAR(40),
    L_NAME VARCHAR(20),
    COMPANY VARCHAR(80) NULL,
    addr VARCHAR(70),
    CITY VARCHAR(40),
    st VARCHAR(40),
    Country VARCHAR(40),
    ZIP VARCHAR(10),
    PhoneNum VARCHAR(24),
    fax_number VARCHAR(24),
    EmailAddress VARCHAR(60),
    SupportRepresentativeID INT,
    c_data TEXT,
    CONSTRAINT customer_pkey PRIMARY KEY (cust_id)
);

CREATE TABLE trk
(
    TrackNo INT NOT NULL,
    TrackTitle VARCHAR(200),
    AlbmID INT NULL,
    MediaTypeIdentifier INT,
    GenreID INT NULL,
    written_by VARCHAR(220),
    length_ms INT,
    size_bytes INT NULL,
    cost NUMERIC(10,2),
    col7 INT,
    rlse_yr INT,
    CONSTRAINT track_pkey PRIMARY KEY (TrackNo)
);

CREATE TABLE invoice
(
    invoice_num INT NOT NULL,
    customerID INT,
    date_of_invoice TIMESTAMP,
    bill_addr VARCHAR(70),
    bill_city VARCHAR(40),
    bill_state VARCHAR(40),
    bill_country VARCHAR(40),
    bill_zip VARCHAR(10),
    TotalAmount NUMERIC(10,2),
    paymntstatus VARCHAR(20),
    CONSTRAINT invoice_pkey PRIMARY KEY (invoice_num)
);

CREATE TABLE inv_line
(
    ID INT NOT NULL,
    inv_id INT,
    TrackIdentifier INT,
    price NUMERIC(10,2),
    qty INT,
    dscnt NUMERIC(4,2),
    CONSTRAINT invoice_line_pkey PRIMARY KEY (ID)
);

CREATE TABLE playlist
(
    list_id INT NOT NULL,
    description VARCHAR(120),
    createdby INT,
    col6 TIMESTAMP,
    numeric_albums VARCHAR(100),
    CONSTRAINT playlist_pkey PRIMARY KEY (list_id)
);

CREATE TABLE playlist_track
(
    pl_id INT NOT NULL,
    t_id INT NOT NULL,
    ordr INT,
    CONSTRAINT playlist_track_pkey PRIMARY KEY (pl_id, t_id)
);

-- Insert data in the correct order with proper foreign key relationships

-- 1. First, insert into employe (self-reference for manager_id)
INSERT INTO employe (EmpID, surname, given_name, JobTitle, manager_id, DOB, StartDate,
                   location, municipality, province, nation, post_code,
                   telephone, facsimile, electronic_mail, col3)
VALUES
    (1, 'Smith', 'John', 'CEO', NULL, '1970-01-15', '2010-03-12',
     '123 Main St', 'Boston', 'MA', 'USA', '02108',
     '555-1234', '555-5678', 'john@example.com', 120000.00),
    (2, 'Johnson', 'Mary', 'CTO', 1, '1980-05-22', '2012-08-15',
     '456 Oak Ave', 'San Francisco', 'CA', 'USA', '94107',
     '555-8765', '555-4321', 'mary@example.com', 110000.00),
    (3, 'Williams', 'Robert', 'Manager', 1, '1985-12-10', '2015-01-05',
     '789 Elm St', 'Chicago', 'IL', 'USA', '60601',
     '555-2468', '555-1357', 'robert@example.com', 95000.00),
    (4, 'Jones', 'Patricia', 'Developer', 2, NULL, '2018-06-20',
     '321 Pine St', 'Seattle', 'WA', 'USA', '98101',
     '555-3698', NULL, 'patricia@example.com', 85000.00),
    (5, 'Brown', 'Michael', 'Designer', 2, '1990-03-28', '2019-11-01',
     '654 Maple Dr', 'Austin', 'TX', 'USA', '78701',
     '555-7539', '555-9513', NULL, 80000.00),
    (6, 'Davis', 'Linda', 'Sales', 3, '1988-07-17', '2017-04-15',
     '987 Cedar Rd', 'New York', 'NY', 'USA', '10001',
     NULL, '555-8642', 'linda@example.com', 75000.00),
    (7, 'García', 'Carlos', 'Support', 3, '1992-09-03', '2020-02-15',
     '741 Birch Ln', 'Miami', 'FL', 'USA', '33101',
     '555-6428', '555-2648', 'carlos@example.com', NULL),
    (8, 'Singh', 'Priya', 'Analyst', 3, '1986-11-20', '2016-07-01',
     '852 Spruce Ct', 'Denver', 'CO', 'USA', '80202',
     '555-9753', NULL, 'priya@example.com', 82000.00),
    (9, 'Chen', 'Wei', 'QA', 4, '1991-04-12', '2018-10-22',
     '369 Ash Way', 'Portland', 'OR', 'USA', '97201',
     '555-1593', '555-3579', 'wei@example.com', 79000.00),
    (10, 'Müller', 'Hans', 'Developer', 2, '1984-06-25', '2014-12-05',
      '147 Walnut Blvd', NULL, NULL, 'Germany', '10115',
      '555-8024', '555-4680', 'hans@example.com', 90000.00);

-- 2. Insert into customer (needs employe for foreign key)
INSERT INTO customer (cust_id, F_NAME, L_NAME, COMPANY, addr, CITY, st, Country, ZIP,
                    PhoneNum, fax_number, EmailAddress, SupportRepresentativeID, c_data)
VALUES
    (1, 'John', 'Doe', 'ABC Inc', '123 Main St', 'NEW YORK', 'NY', 'USA', '10001',
     '555-123-4567', '555-765-4321', 'john.doe@example.com', 3, 'Prefers email contact'),
    (2, 'Jane', 'Smith', NULL, '456 Oak Ave', 'LOS ANGELES', 'CA', 'USA', '90001',
     '555-234-5678', NULL, 'jane.smith@example.com', 6, 'VIP customer'),
    (3, 'Carlos', 'Gomez', 'XYZ Corp', '789 Pine St', 'MIAMI', 'FL', 'USA', '33101',
     '555-345-6789', '555-987-6543', 'carlos@example.com', 9, NULL),
    (4, 'Maria', 'Gonzalez', 'Global Ltd', '321 Elm St', 'CHICAGO', 'IL', 'USA', '60601',
     NULL, '555-456-7654', 'maria@example.com', 3, 'Requires Spanish support'),
    (5, NULL, 'Johnson', 'Johnson Family', '654 Maple Dr', 'HOUSTON', 'TX', 'USA', '77001',
     '555-567-8901', NULL, 'johnson@example.com', 6, 'Missing first name'),
    (6, 'Ahmed', 'Hassan', 'International Co', '987 Cedar Rd', 'PHOENIX', 'AZ', 'USA', '85001',
     '555-678-9012', '555-234-5432', NULL, 9, 'Contact only by phone'),
    (7, 'Sophie', 'Dupont', NULL, '741 Birch Ln', 'MONTREAL', NULL, 'CANADA', 'H2X 2L2',
     '555-789-0123', NULL, 'sophie@example.com', 3, NULL),
    (8, 'Hiroshi', 'Tanaka', 'Tech Co', '852 Spruce Ct', 'TORONTO', 'ON', 'canada', 'M5V 2L7',
     '555-890-1234', '555-345-6543', 'hiroshi@example.com', 6, 'Prefers contact in Japanese'),
    (9, 'Emma', 'Wilson', 'Wilson LLC', '369 Ash Way', 'LONDON', NULL, 'UK', 'EC1A 1BB',
     '555-901-2345', NULL, 'emma@example.com', 9, ''),
    (10, 'Luis', 'Fernandez', 'Startup Inc', '147 Walnut Blvd', 'MEXICO CITY', 'CDMX', 'Mexco', '06000',
     '555-012-3456', '555-876-5432', 'luis@example.com', 3, 'New customer');

-- 3. Insert into genre
INSERT INTO genre (id, genre_type, col4)
VALUES
    (1, 'Rock', 'Guitar-driven music often with drums, bass, and vocals'),
    (2, 'Jaz', 'Complex harmonies and improvisation-based music'),
    (3, 'Hip-Hop', 'Rhythm and rhyme focused vocal delivery over beats'),
    (4, 'Classical', 'Western art music from the Middle Ages to present'),
    (5, NULL, 'Electronic music from clubs with repetitive beats'),
    (6, 'Country', NULL),
    (7, 7, 'Music originating from the Brazilian favelas'),
    (8, 'R&B', 'Rhythm and blues with soul influences'),
    (9, 'POP', 'Commercially oriented popular music'),
    (10, 'folk', 'Traditional music passed through generations');

-- 4. Insert into artist
INSERT INTO artist (ArtistIdentifier, NM, ctry, col2)
VALUES
    (1, 'The Rolling Stones', 'UK', 'English rock band formed in 1962'),
    (2, 'Metallica', 'USA', 'American heavy metal band formed in 1981'),
    (3, 'Queen', 'UK', 'British rock band formed in 1970'),
    (4, NULL, 'Jamaica', 'Reggae pioneer and global music icon'),
    (5, 'Beyoncé', NULL, 'American singer and cultural icon'),
    (6, 'Beatles', 'UK', NULL),
    (7, 7, 'Australia', 'Rock band known for their energetic performances'),
    (8, 'Lady Gaga', 'usa', 'Pop star and actress'),
    (9, 'ABBA', 'SWEDEN', 'Swedish pop group formed in 1972'),
    (10, 'BTS', 'South Korea', '');

-- 5. Insert into media_type (fix the boolean column issue)
INSERT INTO media_type (TypeID, type_desc, col5)
VALUES
    (1, 'MP3', true),
    (2, 'AAC', true),  -- Fixed from 1 to true
    (3, 'WAV', false),
    (4, 'FLAC', false),  -- Fixed from 0 to false
    (5, NULL, true),
    (6, 'OGG Vorbis', NULL),
    (7, 'ALAC', true),
    (8, 'WMA', false),
    (9, 'MP4 Audio', true),  -- Fixed from 1 to true
    (10, 'DSD', false);  -- Fixed from 0 to false

-- 6. Insert into albm (needs artist for foreign key)
INSERT INTO albm (AlbumId, ttle, a_id, col1)
VALUES
    (1, 'Sticky Fingers', 1, 1971),
    (2, 'Master of Puppets', 2, 1986),
    (3, 'A Night at the Opera', 3, 1975),
    (4, NULL, 4, 1977),
    (5, 'Lemonade', 5, 2016),
    (6, 'Sgt Pepper', 6, NULL),
    (7, 7, 7, 1980),
    (8, 'Abbey Road', 6, 196),
    (9, 'The Fame', 8, 2008),
    (10, 'Arrival', 9, 1976);  -- Fixed from string to integer

-- 7. Insert into trk (needs album, genre, and media_type for foreign keys)
INSERT INTO trk (TrackNo, TrackTitle, AlbmID, MediaTypeIdentifier, GenreID, written_by,
               length_ms, size_bytes, cost, col7, rlse_yr)
VALUES
    (1, 'Brown Sugar', 1, 1, 1, 'Jagger/Richards', 228280, 3821731, 0.99, 92, 1971),
    (2, 'Master of Puppets', 2, 2, 1, 'Metallica', 515240, 8587056, 0.99, 96, 1986),
    (3, 'Bohemian Rhapsody', 3, 3, 1, 'Freddie Mercury', 354320, 5904969, 0.99, 98, 1975),
    (4, NULL, 4, 4, 2, 'Bob Marley', 180000, 2998272, 0.99, 88, 1977),
    (5, 'Formation', 5, 5, 3, 'Beyoncé, Khalif Brown, Jordan Frost', 242000, 4032000, 1.29, 95, 2016),
    (6, 'Lucy in the Sky with Diamonds', 6, 6, 1, 'Lennon/McCartney', 208000, 3466240, 0.99, NULL, 1967),
    (7, 7, 7, 7, 3, NULL, 321000, 5349990, 0.99, 78, NULL),
    (8, 'Something', 8, 8, 1, 'George Harrison', 182000, 3031526, 9.99, 89, 1969),
    (9, 'Poker Face', 9, 9, 9, 'Lady Gaga, RedOne', 238000, 3967320, 0.99, 3000, 2008),
    (10, 'Dancing Queen', 10, 10, 9, 'Andersson/Ulvaeus', 230400, 3839795, 0.99, 94, 1976);

-- 8. Insert into invoice (needs customer for foreign key)
INSERT INTO invoice (invoice_num, customerID, date_of_invoice, bill_addr, bill_city,
                   bill_state, bill_country, bill_zip, TotalAmount, paymntstatus)
VALUES
    (1, 1, '2023-01-15', '123 Main St', 'New York', 'NY', 'USA', '10001', 19.98, 'PAID'),
    (2, 2, '2023-02-20', '456 Oak Ave', 'Los Angeles', 'CA', 'USA', '90001', 8.99, 'paid'),
    (3, 3, '2023-03-10', '789 Pine St', 'Miami', 'FL', 'USA', '33101', 29.97, NULL),
    (4, 4, '2023-04-05', '321 Elm St', 'Chicago', 'IL', 'USA', '60601', 14.95, 'PENDING'), -- Fixed numeric to string
    (5, 5, '2023-05-25', '654 Maple Dr', 'Houston', 'TX', 'USA', '77001', 45.50, 'PENDING'),
    (6, 6, '2023-06-12', '987 Cedar Rd', 'Phoenix', 'AZ', 'USA', '85001', 25.75, 'REFUNDED'),
    (7, 7, '2023-07-08', '741 Birch Ln', 'Montreal', NULL, 'Canada', 'H2X 2L2', NULL, 'PAID'),
    (8, 8, '2023-08-18', NULL, 'Toronto', 'ON', 'Canada', 'M5V 2L7', 12.99, 'PAID'),
    (9, 9, '2023-09-30', '369 Ash Way', 'London', NULL, 'UK', 'EC1A 1BB', 32.45, 'PENDING'),
    (10, 10, '2023-10-22', '147 Walnut Blvd', 'Mexico City', 'CDMX', 'Mexco', '06000', 55.90, 'PAID');

-- 9. Insert into playlist
INSERT INTO playlist (list_id, description, createdby, col6, numeric_albums)
VALUES
    (1, 'Rock Classics', 3, '2023-01-10 14:30:00', NULL),
    (2, 'Jazz & Blues', 6, '2023-02-15 09:45:00', NULL),
    (3, NULL, 9, '2023-03-20 16:15:00', '80s albums'),
    (4, 'Workout Mix', NULL, '2023-04-25 11:00:00', 'High energy songs'),
    (5, '90s Hits', 3, NULL, '90s collection'),
    (6, 'Study Music', 6, '2023-06-05 13:45:00', NULL),
    (7, 'Party Anthems', 9, '2023-07-10 20:30:00', 'Dance hits'),
    (8, 'Chill Vibes', 3, '2023-08-15 17:15:00', 'Relaxing tunes'),
    (9, 'Road Trip', 6, '2023-09-20 08:00:00', NULL),
    (10, 'Mood Boosters', 9, '2023-10-25 12:30:00', 'Uplifting songs');

-- 10. Insert into inv_line (needs invoice and trk for foreign keys)
-- Fixed to use only existing track IDs and invoice IDs
INSERT INTO inv_line (ID, inv_id, TrackIdentifier, price, qty, dscnt)
VALUES
    (1, 1, 1, 0.99, 2, NULL),
    (2, 1, 2, 0.99, 1, 0),
    (3, 2, 3, 0.99, 3, 0.1),
    (4, 3, 4, 0.99, 2, 0),
    (5, 4, 5, 1.29, 1, 0),
    (6, 5, NULL, 0.99, 4, 0.15),
    (7, 6, 7, NULL, 2, 0),
    (8, 7, 8, 9.99, NULL, 0),
    (9, 8, 9, 0.99, 3, 0),  -- Fixed string to integer
    (10, 9, 10, 0.99, 0, 0.25);

-- 11. Insert into playlist_track (needs playlist and trk for foreign keys)
INSERT INTO playlist_track (pl_id, t_id, ordr)
VALUES
    (1, 1, 1),
    (1, 2, 2),
    (2, 3, 1),
    (2, 4, NULL),
    (3, 5, 1),
    (4, 6, 1),
    (5, 7, 1),
    (6, 8, NULL),
    (7, 9, 1),
    (8, 10, 1);

-- Add foreign key constraints after data is inserted
ALTER TABLE albm ADD CONSTRAINT album_artist_id_fkey
    FOREIGN KEY (a_id) REFERENCES artist (ArtistIdentifier) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX idx_album_artist ON albm (a_id);

ALTER TABLE customer ADD CONSTRAINT customer_support_rep_id_fkey
    FOREIGN KEY (SupportRepresentativeID) REFERENCES employe (EmpID) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_customer_support ON customer (SupportRepresentativeID);

ALTER TABLE employe ADD CONSTRAINT employee_reports_to_fkey
    FOREIGN KEY (manager_id) REFERENCES employe (EmpID) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_emp_mgr ON employe (manager_id);

ALTER TABLE invoice ADD CONSTRAINT invoice_customer_id_fkey
    FOREIGN KEY (customerID) REFERENCES customer (cust_id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX idx_inv_cust ON invoice (customerID);

ALTER TABLE inv_line ADD CONSTRAINT invoice_line_invoice_id_fkey
    FOREIGN KEY (inv_id) REFERENCES invoice (invoice_num) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX idx_invline_inv ON inv_line (inv_id);

ALTER TABLE inv_line ADD CONSTRAINT invoice_line_track_id_fkey
    FOREIGN KEY (TrackIdentifier) REFERENCES trk (TrackNo) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_invline_track ON inv_line (TrackIdentifier);

ALTER TABLE playlist_track ADD CONSTRAINT playlist_track_playlist_id_fkey
    FOREIGN KEY (pl_id) REFERENCES playlist (list_id) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX idx_pltrack_pl ON playlist_track (pl_id);

ALTER TABLE playlist_track ADD CONSTRAINT playlist_track_track_id_fkey
    FOREIGN KEY (t_id) REFERENCES trk (TrackNo) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX idx_pltrack_track ON playlist_track (t_id);

ALTER TABLE trk ADD CONSTRAINT track_album_id_fkey
    FOREIGN KEY (AlbmID) REFERENCES albm (AlbumId) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_track_album ON trk (AlbmID);

ALTER TABLE trk ADD CONSTRAINT track_genre_id_fkey
    FOREIGN KEY (GenreID) REFERENCES genre (id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_track_genre ON trk (GenreID);

ALTER TABLE trk ADD CONSTRAINT track_media_type_id_fkey
    FOREIGN KEY (MediaTypeIdentifier) REFERENCES media_type (TypeID) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_track_media ON trk (MediaTypeIdentifier);