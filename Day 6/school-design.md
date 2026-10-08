# School Database Design

## 1. Students Table

The `students` table stores information about each student in the school system. It contains a unique `student_id`, the student's name, and their email address. The `student_id` is the primary key, while the email address is also required to be unique so that two students cannot register using the same email address.

## 2. Courses Table

The `courses` table stores information about the courses offered by the school. It contains a unique `course_id` as the primary key and the `course_name`, which stores the name of each course.

## 3. Enrolments Table

The `enrolments` table records the courses that students have enrolled in. It contains an `enrolment_id` as its primary key, as well as `student_id` and `course_id` as foreign keys. It also stores the student's `grade` for that course.

## 4. Relationships

There is a one-to-many relationship between `students` and `enrolments`. One student can have many enrolments, but each enrolment belongs to one student.

There is also a one-to-many relationship between `courses` and `enrolments`. One course can have many enrolments, but each enrolment belongs to one course.

Together, `students` and `courses` have a many-to-many relationship. A student can take many courses, and a course can have many students. The `enrolments` table is needed as a join table because it breaks the many-to-many relationship into two one-to-many relationships. It also gives us a place to store information about the relationship itself, such as the student's grade.

The `UNIQUE (student_id, course_id)` rule prevents the same student from enrolling in the same course more than once.

## 5. Index

I would add an index on `enrolments.student_id` because student enrolment information will often be searched or joined using the student's ID. An index can make these searches and JOIN operations faster, especially when the database contains many enrolment records.

For example:

```sql
CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);
```

## 6. SQL or NoSQL?

I would choose SQL for this school system because the data has clear relationships between students, courses, and enrolments. Students can take multiple courses and courses can have multiple students, making a relational database a good fit. SQL also provides primary keys, foreign keys, UNIQUE constraints, JOINs, GROUP BY, and transactions, which help maintain data integrity and make it easy to query related information. A NoSQL database could work for a less structured system, but SQL is more suitable here because the relationships and structure of the school data are well defined.
