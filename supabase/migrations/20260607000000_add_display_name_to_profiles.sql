ALTER TABLE profiles ADD COLUMN display_name VARCHAR(255);
UPDATE profiles SET display_name = username WHERE display_name IS NULL;
