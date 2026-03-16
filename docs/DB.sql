CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app_zenith;
SET search_path TO app_zenith;

-- 0. CLEANUP (DROP TABLES)

DROP TABLE IF EXISTS user_game_session CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS course_module CASCADE;
DROP TABLE IF EXISTS users_course CASCADE;
DROP TABLE IF EXISTS game_catalog CASCADE;
DROP TABLE IF EXISTS course CASCADE;
DROP TABLE IF EXISTS course_category CASCADE;
DROP TABLE IF EXISTS user_emblem CASCADE;
DROP TABLE IF EXISTS categories_emblem CASCADE;
DROP TABLE IF EXISTS emblem CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS AND PROFILES

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) unique,
  full_name VARCHAR(80) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT,
  auth_provider VARCHAR(50) DEFAULT 'local',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  description text,
  language VARCHAR(100), 
  photo VARCHAR(250),
  phone VARCHAR(15), 
  country VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. REWARD SYSTEM (EMBLEMS)

CREATE TABLE IF NOT EXISTS emblem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  redeem_points INT NOT NULL DEFAULT 100 
);

CREATE TABLE IF NOT EXISTS categories_emblem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description VARCHAR(50),
  categories VARCHAR(10),
  emblem_id UUID REFERENCES emblem(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_emblem (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emblem_id UUID REFERENCES emblem(id) ON DELETE CASCADE,
  won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, emblem_id)
);

-- 3. COURSE AND GAME CATALOG SYSTEM

CREATE TABLE IF NOT EXISTS course_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) UNIQUE NOT NULL,
  description VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS game_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  game_type VARCHAR(30),
  src varchar(50)
);

CREATE TABLE IF NOT EXISTS course (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  cover_photo TEXT, 
  is_public BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES course_category(id) ON DELETE SET NULL,
  game_id UUID REFERENCES game_catalog(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_module (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES course(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT, 
  order_index INT NOT NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users_course (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES course(id) ON DELETE CASCADE,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  PRIMARY KEY (user_id, course_id)
);

-- 4. ACTIVITY TRACKING

CREATE TABLE IF NOT EXISTS user_game_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES game_catalog(id) ON DELETE CASCADE,
  course_id UUID REFERENCES course(id) ON DELETE CASCADE,
  earned_points INT DEFAULT 0,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_balance INT DEFAULT 0,
  lifetime_points INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0
);

---------------create course------------------------

create or replace function create_course(

	p_user_id UUID,
	p_title varchar,
	p_desc text,
	p_cover_photo text,
	p_game_id uuid,
	p_category_id uuid,
	p_is_public boolean default false
		
) returns uuid as $$
declare

	v_new_course_id UUID;
	
begin
	
	insert into app_zenith.course(
		user_id,
		title,
		description,
		cover_photo,
		is_public,
		category_id,
		game_id
	)
	values(
		p_user_id,
		p_title,
		p_desc,
		p_cover_photo,
		p_is_public,
		p_category_id,
		p_game_id
	)
	returning id into v_new_course_id;

	return v_new_course_id;
	
end;
$$ language plpgsql;

-------------------------------------------------

------------update courses-----------------------

create or replace function update_course(
	p_course_id uuid,
	p_user_id uuid,
	p_title varchar,
	p_desc text,
	p_cover_photo text,
	p_game_id uuid,
	p_category_id uuid,
	p_is_public boolean default false
	
)returns uuid as $$
declare

	v_updated_id uuid;
	
begin
	
	update app_zenith.course set
		title = p_title,
		description = p_desc,
		cover_photo = p_cover_photo,
		is_public = p_is_public,
		category_id = p_category_id,
		game_id = p_game_id,
		updated_at = current_timestamp
	where id = p_course_id and user_id = p_user_id returning id into v_updated_id;
	

	return v_updated_id;
	
end;
$$ language plpgsql;

----------------------------------------------

----------------get my courses----------------

create or replace function get_my_course(p_user_id uuid)
returns table(
	course_id uuid,
	title varchar,
	description text,
	cover_photo text,
	category_id uuid,
	game_id uuid,
	game_src varchar,
	is_mine boolean,
	modules json
)as $$	
begin 
	return query
	select
		c.id,
		c.title,
		c.description,
		c.cover_photo,
		c.category_id,
		c.game_id,
		g.src,
		true::boolean,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', cm.id,
                    'title', cm.title,
                    'content', cm.content,
                    'order_index', cm.order_index
                ) ORDER BY cm.order_index
            ) FILTER (WHERE cm.id IS NOT NULL),
            '[]'::json
        )

    FROM course c	
	LEFT JOIN game_catalog g ON c.game_id = g.id
    LEFT JOIN course_module cm ON cm.course_id = c.id
    WHERE c.user_id = p_user_id
    GROUP BY c.id, c.category_id, c.game_id, g.src;

end;
$$ language plpgsql;

----------------------------------------------

------Function for get courses of people------

create or replace function get_user_course(p_user_id uuid)
returns table(
	course_id uuid,
	title varchar,
	description text,
	cover_photo text,
	category_name varchar,
	game_src varchar,
	is_mine boolean,
	modules json
)as $$	
begin 
	return query
	select
		c.id,
		c.title,
		c.description,
		c.cover_photo,
		cat.name,
		g.src,
		false:: boolean,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', cm.id,
                    'title', cm.title,
                    'content', cm.content,
                    'order_index', cm.order_index
                ) ORDER BY cm.order_index
            ) FILTER (WHERE cm.id IS NOT NULL),
            '[]'::json
        )
	FROM course c
    JOIN users_course uc ON c.id = uc.course_id
	LEFT JOIN game_catalog g ON c.game_id = g.id
    LEFT JOIN course_category cat ON c.category_id = cat.id
    LEFT JOIN course_module cm ON cm.course_id = c.id
    WHERE uc.user_id = p_user_id
    GROUP BY c.id, cat.name, g.src;

end;
$$ language plpgsql;
---------------------------------

--------get public courses-------

CREATE OR REPLACE FUNCTION get_public_courses()
RETURNS TABLE(
    course_id uuid,
    title varchar,
    description text,
    cover_photo text,
    category_name varchar,
    author_name varchar,
    game_src varchar,
    is_mine boolean,
    modules json
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.description,
        c.cover_photo,
        cat.name,
        u.full_name,
		g.src,
        false::boolean,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', cm.id,
                    'title', cm.title,
                    'content', cm.content,
                    'order_index', cm.order_index
                ) ORDER BY cm.order_index
            ) FILTER (WHERE cm.id IS NOT NULL),
            '[]'::json
        )
    FROM course c
    JOIN users u ON c.user_id = u.id
	LEFT JOIN game_catalog g ON c.game_id = g.id
    LEFT JOIN course_category cat ON c.category_id = cat.id
    LEFT JOIN course_module cm ON cm.course_id = c.id
    WHERE c.is_public = true
    GROUP BY c.id, cat.name, u.full_name, g.src;
END;
$$ LANGUAGE plpgsql;

------------------------------------------


-----------game session-------------------

CREATE OR REPLACE FUNCTION save_first_session(
    p_user_id uuid,
    p_game_id uuid,
    p_course_id uuid,
    p_score int
) RETURNS uuid AS $$
DECLARE
    v_session_id uuid;
BEGIN

    IF EXISTS (
        SELECT 1 FROM user_game_session 
        WHERE user_id = p_user_id AND course_id = p_course_id
    ) THEN
        RETURN NULL;
    END IF;

    INSERT INTO user_game_session(
		user_id, 
		game_id, 
		course_id, 
		earned_points)
    VALUES (
		p_user_id, 
		p_game_id, 
		p_course_id, 
		p_score)
    RETURNING id INTO v_session_id;

    UPDATE users_course SET progress = 100
    WHERE user_id = p_user_id AND course_id = p_course_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;
--------------------------------------------------------

----------------User join courses------------------------

CREATE OR REPLACE FUNCTION join_course(
    p_user_id uuid,
    p_course_id uuid
) RETURNS int AS $$
DECLARE
    v_progress int;
BEGIN

    SELECT progress INTO v_progress
    FROM users_course
    WHERE user_id = p_user_id AND course_id = p_course_id;

    IF FOUND THEN
        RETURN v_progress;
    END IF;

    INSERT INTO users_course (user_id, course_id, progress)
    VALUES (p_user_id, p_course_id, 0);

    RETURN 0;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------

------------get user dashboard-----------------------

CREATE OR REPLACE FUNCTION get_user_dashboard_history(p_user_id UUID)
RETURNS TABLE (
    "Name" TEXT,
    "Efficiency" TEXT,
    "xp" INTEGER,
    "Date" TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    -- A. Cursos (4 columnas)
    SELECT 
        c.title::TEXT as "Name", 
        '100%'::TEXT as "Efficiency", 
        50 as "xp", 
        c.created_at as "Date"
    FROM users_course uc
    JOIN course c ON uc.course_id = c.id
    WHERE uc.user_id = p_user_id

    UNION ALL

    -- B. Juegos (4 columnas - coincidencia exacta)
    SELECT 
        COALESCE(gc.name, ugs.game_id::TEXT) as "Name", 
        '100%'::TEXT as "Efficiency", 
        ugs.earned_points as "xp", 
        ugs.played_at as "Date"
    FROM user_game_session ugs
    LEFT JOIN game_catalog gc ON ugs.game_id = gc.id
    WHERE ugs.user_id = p_user_id
    
    ORDER BY "Date" DESC;
END;
$$ LANGUAGE plpgsql;

----------------------------------

------------function trigger----------

CREATE OR REPLACE FUNCTION app_zenith.create_user_points_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO app_zenith.user_points (user_id, lifetime_points, current_balance)
    VALUES (NEW.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_points_after_signup
AFTER INSERT ON app_zenith.users
FOR EACH ROW
EXECUTE FUNCTION app_zenith.create_user_points_entry();

----------------------------------------------------

----------------------data of tables-----------------

-- Categories
INSERT INTO app_zenith.course_category (name, description) VALUES
('Software Development', 'Coding, algorithms, and software architecture.'),
('Programming', 'General programming logic and language syntax.'),
('Cooking', 'Culinary arts, recipes, and kitchen techniques.'),
('Art', 'Visual arts, drawing, painting, and digital design.'),
('Culture', 'History, languages, and social sciences.'),
('Video Games', 'Game design, mechanics, and competitive gaming.'),
('Business & Finance', 'Entrepreneurship, marketing, and personal finance.'),
('Health & Wellness', 'Fitness, mental health, and nutrition.'),
('Music', 'Theory, instruments, and music production.'),
('Photography', 'Photo editing, lighting, and camera handling.'),
('Science', 'Physics, biology, and experimental research.'),
('Crafts & DIY', 'Handmade projects, woodworking, and home repair.');

-- Games
INSERT INTO app_zenith.game_catalog (name, description, game_type, src) VALUES
('Type-Zenith', 'A spaceship action game where players must type and complete code snippets to navigate and survive.', 'Programming','type-Zenith'),
('Jet-Package', 'A platformer game where players use a jetpack to ascend through levels by answering questions correctly.', 'Questions', 'jet-Package'),
('Code-Crush', 'A code-themed match-three puzzle game where players solve logic questions to clear blocks.', 'Questions','code-Crush');