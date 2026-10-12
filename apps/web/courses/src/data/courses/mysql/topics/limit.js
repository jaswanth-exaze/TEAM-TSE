// Extracted lesson content for the limit topic.
const lesson = {
  "id": "limit",
  "status": "full",
  "sourceTitle": "LIMIT",
  "sourceDocuments": [
    {
      "title": "LIMIT",
      "part": 1,
      "topicNumber": 10,
      "difficulty": "Beginner",
      "prerequisites": "order-by"
    }
  ],
  "relatedTopicId": null,
  "sections": {
    "whatIsIt": "LIMIT restricts the number of rows returned by a query. It's perfect for \"top N\" queries like \"show me the 5 highest-paid employees\" or for pagination like \"show me results 11-20\". LIMIT prevents accidentally retrieving millions of rows when you only need a few.\n\nReal-world analogy: A search engine showing \"Page 1 of results\" — that's LIMIT in action.",
    "syntaxBreakdown": "SELECT columns\nFROM table\nWHERE conditions\nORDER BY column\nLIMIT number_of_rows;\nOr with offset (for pagination):\n\nLIMIT offset, number_of_rows;\nLIMIT 10 — Return only the first 10 rows\nLIMIT 5, 10 — Skip the first 5 rows, then return the next 10 (rows 6-15)",
    "basicExample": "Top 5 Highest-Paid Employees\nSELECT first_name, last_name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 5;\nExpected output:\n\nfirst_name\tlast_name\tsalary\nAlice\tJohnson\t120000.00\nMia\tWhite\t115000.00\nJack\tAnderson\t110000.00\nKaren\tThomas\t105000.00\nOlivia\tMartin\t98000.00\nHow it works: ORDER BY sorts by salary (highest first), then LIMIT stops after 5 rows.\n\nFirst 3 Employees (by employee_id)\nSELECT employee_id, first_name, last_name\nFROM employees\nORDER BY employee_id ASC\nLIMIT 3;\nExpected output:\n\nemployee_id\tfirst_name\tlast_name\n1\tAlice\tJohnson\n2\tBob\tSmith\n3\tCarol\tWilliams",
    "goingDeeper": "LIMIT with Offset (Pagination)\nShow employees 6-10 when sorted by salary (descending):\n\nSELECT first_name, last_name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 5, 5;\nWhat this does:\n\nLIMIT 5, 5 = Skip first 5 rows, return next 5 rows\nSyntax: LIMIT offset, count\nExpected output: Employees ranked 6-10 by salary.\n\nPagination pattern:\n\nPage 1 (rows 1-10): LIMIT 0, 10\nPage 2 (rows 11-20): LIMIT 10, 10\nPage 3 (rows 21-30): LIMIT 20, 10\nPause and Predict: For Page 5 showing 10 results per page, what's the LIMIT clause?\n\nAnswer\nAlternative OFFSET Syntax (MySQL 8+)\nSELECT first_name, last_name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 5 OFFSET 5;\nSame as: LIMIT 5, 5\n\nThis syntax is clearer: \"LIMIT 5 rows, starting OFFSET 5\"\n\nLIMIT Without ORDER BY (Unpredictable!)\nSELECT first_name, last_name\nFROM employees\nLIMIT 3;\nWhat happens: Returns 3 rows, but which 3 is unpredictable. MySQL returns them in whatever order they're stored internally.\n\nBest practice: Always use LIMIT with ORDER BY unless you genuinely don't care which rows you get.",
    "commonMistakes": "Mistake #1: LIMIT Before ORDER BY\n-- WRONG — Syntax error\nSELECT first_name, last_name, salary\nFROM employees\nLIMIT 5\nORDER BY salary DESC;\nError: You have an error in your SQL syntax\n\nCorrect order:\n\nSELECT\nFROM\nWHERE (if filtering)\nORDER BY (if sorting)\nLIMIT (always last)\n-- CORRECT\nSELECT first_name, last_name, salary\nFROM employees\nORDER BY salary DESC\nLIMIT 5;\nMistake #2: Thinking LIMIT Affects Performance of WHERE\nSELECT * FROM employees\nWHERE salary > 50000\nLIMIT 5;\nWhat beginners think: \"MySQL finds 5 employees with salary > 50000, then stops\"\n\nWhat actually happens: MySQL finds ALL employees with salary > 50000, then returns only 5 of them. LIMIT is applied AFTER the WHERE clause evaluates.\n\nFor small tables (like ours), this doesn't matter. For tables with millions of rows:\n\nWHERE still scans the whole dataset\nLIMIT just limits the output\nUse indexes to speed up WHERE (advanced topic)\nMistake #3: Offset Math Errors\n-- WRONG for Page 2 of 10 results per page\nSELECT * FROM employees\nORDER BY employee_id\nLIMIT 10, 20;  -- This skips 10, then returns 20 rows (rows 11-30)\nWhat you wanted: Rows 11-20 (Page 2, 10 results per page)\n\n-- CORRECT\nSELECT * FROM employees\nORDER BY employee_id\nLIMIT 10, 10;  -- Skip 10, return 10 (rows 11-20)",
    "edgeCaseSpotlight": "LIMIT with Fewer Rows Available\nSELECT first_name, last_name\nFROM employees\nWHERE department_id = 1\nLIMIT 100;\nWhat happens: There are only 5 employees in department 1. MySQL returns all 5 — it doesn't error because you asked for 100.\n\nLesson: LIMIT is a maximum, not a guarantee. If fewer rows match, you get fewer rows.\n\nLIMIT 1 for \"First Match\"\nSELECT first_name, last_name, salary\nFROM employees\nWHERE salary > 100000\nORDER BY salary DESC\nLIMIT 1;\nUse case: \"Who is the highest-paid employee making over $100K?\"\n\nResult: Alice Johnson ($120,000)\n\nWhy LIMIT 1 is useful:\n\nGuarantees only one row returned\nMakes your intent clear (you want a single result)\nSlightly more efficient (MySQL can stop as soon as it finds 1 match)",
    "tryThis": "Exercise 1 (Guided)\nFind the 3 most recent projects (by start_date). Show project_name and start_date.\n\nHint\nExercise 2 (Independent)\nShow employees 11-15 when sorted alphabetically by last name. Include first_name and last_name.\n\nHint\nExercise 3 (Challenge)\nFind the employee with the lowest salary who was hired after 2020. Show their name, salary, and hire date.",
    "answerKey": "Exercise 1 Answer\nExercise 2 Answer\nExercise 3 Answer",
    "quickRecap": "• LIMIT restricts the number of rows returned\n• Perfect for \"top N\" queries and pagination\n• Syntax: LIMIT count or LIMIT offset, count\n• Always use with ORDER BY (otherwise results are unpredictable)\n• LIMIT always comes last in your query\n• If fewer rows exist, LIMIT returns what's available (no error)",
    "upNext": "Next topic: Aggregate Functions (COUNT, SUM, AVG, MIN, MAX) → part1_11_aggregate_functions.md\n\nYou can now filter, sort, and limit results. Next, you'll learn how to summarize data — counting rows, calculating averages, finding totals!"
  }
}

export default lesson
