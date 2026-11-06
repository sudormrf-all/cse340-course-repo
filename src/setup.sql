-- CSE 340 Service Network database setup
-- Run this in the pgAdmin Query Tool to (re)create the database tables and sample data.

-- ===== Organizations =====
CREATE TABLE organization (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    logo_filename VARCHAR(255) NOT NULL
);

INSERT INTO organization (name, description, contact_email, logo_filename)
VALUES
    ('BrightFuture Builders',
     'A nonprofit focused on improving community infrastructure through sustainable construction projects.',
     'info@brightfuturebuilders.org',
     'brightfuture-logo.png'),
    ('GreenHarvest Growers',
     'An urban farming collective promoting food sustainability and education in local neighborhoods.',
     'contact@greenharvest.org',
     'greenharvest-logo.png'),
    ('UnityServe Volunteers',
     'A volunteer coordination group supporting local charities and service initiatives.',
     'hello@unityserve.org',
     'unityserve-logo.png');

-- ===== Service Projects =====
-- Each project is sponsored by exactly one organization (one-to-many).
CREATE TABLE project (
    project_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    project_date DATE NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organization (organization_id)
);

INSERT INTO project (organization_id, title, description, location, project_date)
VALUES
    -- BrightFuture Builders (organization_id 1)
    (1, 'Community Center Roof Repair',
     'Help replace damaged roofing on the neighborhood community center.',
     'Riverside Community Center', '2026-11-21'),
    (1, 'Playground Rebuild',
     'Assemble new, accessible playground equipment for local families.',
     'Maple Street Park', '2026-12-05'),
    (1, 'Wheelchair Ramp Installation',
     'Build wheelchair ramps for elderly and disabled residents.',
     'Various homes in the Eastside neighborhood', '2027-01-16'),
    (1, 'Habitat Home Framing',
     'Frame walls and install windows for an affordable family home.',
     '412 Oak Avenue', '2027-02-13'),
    (1, 'Solar Panel Workshop',
     'Install solar panels on a nonprofit shelter and learn the basics of solar energy.',
     'Hope Family Shelter', '2027-03-20'),

    -- GreenHarvest Growers (organization_id 2)
    (2, 'Winter Greenhouse Setup',
     'Prepare raised beds and greenhouse covers for winter vegetables.',
     'Downtown Community Garden', '2026-11-14'),
    (2, 'School Garden Day',
     'Teach elementary students how to plant and care for a vegetable garden.',
     'Lincoln Elementary School', '2026-12-12'),
    (2, 'Composting Workshop',
     'Build compost bins and teach residents how to compost kitchen waste.',
     'Greenway Library Meeting Room', '2027-01-23'),
    (2, 'Fruit Tree Planting',
     'Plant fruit trees to create a free neighborhood food orchard.',
     'Cedar Hill Park', '2027-02-27'),
    (2, 'Farmers Market Food Rescue',
     'Collect unsold produce and deliver it to local food pantries.',
     'Central Farmers Market', '2027-03-13'),

    -- UnityServe Volunteers (organization_id 3)
    (3, 'Holiday Food Drive',
     'Sort and pack food donations for families in need during the holidays.',
     'UnityServe Warehouse', '2026-11-28'),
    (3, 'Winter Coat Collection',
     'Collect, sort, and distribute warm coats to people experiencing homelessness.',
     'Downtown Transit Center', '2026-12-19'),
    (3, 'Senior Center Visit',
     'Spend an afternoon playing games and visiting with residents.',
     'Sunrise Senior Living', '2027-01-09'),
    (3, 'Literacy Tutoring Night',
     'Tutor children and adults who are learning to read.',
     'Westside Public Library', '2027-02-06'),
    (3, 'Neighborhood Cleanup',
     'Pick up litter and clear storm drains throughout the neighborhood.',
     'Elm Street and 5th Avenue', '2027-03-27');

-- ===== Categories =====
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO category (name)
VALUES
    ('Environmental'),           -- 1
    ('Educational'),             -- 2
    ('Community Service'),       -- 3
    ('Health and Wellness'),     -- 4
    ('Construction and Repair'); -- 5

-- ===== Project <-> Category (many-to-many) =====
-- Junction table: a project can have many categories and a category can have many projects.
CREATE TABLE project_category (
    project_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, category_id),
    FOREIGN KEY (project_id) REFERENCES project (project_id),
    FOREIGN KEY (category_id) REFERENCES category (category_id)
);

INSERT INTO project_category (project_id, category_id)
VALUES
    (1, 5), (1, 3),          -- Community Center Roof Repair
    (2, 5), (2, 4),          -- Playground Rebuild
    (3, 5), (3, 4),          -- Wheelchair Ramp Installation
    (4, 5), (4, 3),          -- Habitat Home Framing
    (5, 5), (5, 1), (5, 2),  -- Solar Panel Workshop
    (6, 1), (6, 4),          -- Winter Greenhouse Setup
    (7, 1), (7, 2),          -- School Garden Day
    (8, 1), (8, 2),          -- Composting Workshop
    (9, 1),                  -- Fruit Tree Planting
    (10, 3), (10, 4),        -- Farmers Market Food Rescue
    (11, 3),                 -- Holiday Food Drive
    (12, 3), (12, 4),        -- Winter Coat Collection
    (13, 3), (13, 4),        -- Senior Center Visit
    (14, 2),                 -- Literacy Tutoring Night
    (15, 1), (15, 3);        -- Neighborhood Cleanup
