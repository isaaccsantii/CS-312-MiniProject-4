-- CS-312 Mini Project 4: database schema
-- Same tables as Mini Project 3, plus optional profile fields on users
-- (age, occupation, city) for the My Profile page.
-- Run inside the BlogDB4 database, then run seed.sql.

DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id     VARCHAR(255) PRIMARY KEY,
  password    VARCHAR(255) NOT NULL,          -- bcrypt hash, never the raw password
  name        VARCHAR(255) NOT NULL,
  age         INTEGER      CHECK (age IS NULL OR (age BETWEEN 13 AND 120)),
  occupation  VARCHAR(100),
  city        VARCHAR(100),
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE blogs (
  blog_id          SERIAL PRIMARY KEY,
  creator_name     VARCHAR(255) NOT NULL,
  creator_user_id  VARCHAR(255) NOT NULL
                   REFERENCES users (user_id)
                   ON UPDATE CASCADE
                   ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  body             TEXT         NOT NULL,
  category         VARCHAR(50)  NOT NULL DEFAULT 'Other',
  date_created     TIMESTAMP    NOT NULL DEFAULT NOW(),
  date_updated     TIMESTAMP
);

CREATE INDEX blogs_creator_idx ON blogs (creator_user_id);
CREATE INDEX blogs_date_idx    ON blogs (date_created DESC);
