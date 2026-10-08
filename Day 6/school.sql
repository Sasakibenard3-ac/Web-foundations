PRAGMA foreign_keys = ON;

-- ============================================
-- DAY 6 ASSIGNMENT: SCHOOL DATABASE
-- ============================================

-- 1. STUDENTS TABLE
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- 2. COURSES TABLE
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL
);

-- 3. ENROLMENTS TABLE
-- This is the join table between students and courses.
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),

    UNIQUE (student_id, course_id)
);

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);
-- ============================================
-- SAMPLE STUDENTS
-- ============================================

INSERT INTO students (student_id, name, email)
VALUES
    (1, 'Benard Sasaki', 'benard@example.com'),
    (2, 'Sarah Namukasa', 'sarah@example.com'),
    (3, 'David Okello', 'david@example.com'),
    (4, 'Grace Achieng', 'grace@example.com');

-- ============================================
-- SAMPLE COURSES
-- ============================================

INSERT INTO courses (course_id, course_name)
VALUES
    (1, 'HTML and CSS'),
    (2, 'JavaScript'),
    (3, 'Database Systems');

-- ============================================
-- SAMPLE ENROLMENTS
-- ============================================

INSERT INTO enrolments (enrolment_id, student_id, course_id, grade)
VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'A'),
    (4, 2, 3, 'B'),
    (5, 3, 2, 'A');

-- ============================================
-- QUERY 1
-- ALL COURSES FOR ONE STUDENT BY NAME
-- ============================================

SELECT
    students.name AS student_name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE students.name = 'Benard Sasaki';

-- ============================================
-- QUERY 2
-- ALL STUDENTS ON ONE COURSE
-- ============================================

SELECT
    courses.course_name,
    students.name AS student_name
FROM courses
JOIN enrolments
    ON courses.course_id = enrolments.course_id
JOIN students
    ON enrolments.student_id = students.student_id
WHERE courses.course_name = 'HTML and CSS';

-- ============================================
-- QUERY 3
-- NUMBER OF STUDENTS PER COURSE
-- ============================================

SELECT
    courses.course_name,
    COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;

-- ============================================
-- QUERY 4
-- STUDENTS WHO HAVE NO ENROLMENTS
-- ============================================

SELECT
    students.student_id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.student_id IS NULL;

-- ============================================
-- QUERY 5
-- UPDATE ONE ENROLMENT'S GRADE
-- ============================================

UPDATE enrolments
SET grade = 'A+'
WHERE enrolment_id = 2;