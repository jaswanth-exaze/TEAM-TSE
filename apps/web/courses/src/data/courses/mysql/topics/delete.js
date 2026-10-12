// Extracted lesson content for the delete topic.
const lesson = {
  "id": "delete",
  "status": "full",
  "sourceTitle": "DELETE",
  "sourceDocuments": [
    {
      "title": "DELETE",
      "part": 1,
      "topicNumber": 4,
      "difficulty": "Beginner",
      "prerequisites": "insert, update"
    }
  ],
  "relatedTopicId": null,
  "sections": {
    "whatIsIt": "DELETE removes entire rows from a table. Unlike UPDATE (which changes values), DELETE removes the row completely. Think of it like removing an entire row from a spreadsheet — once it's gone, all data in that row is gone.\n\nReal-world analogy: An employee leaves the company. If you don't need to keep their records, you DELETE their row from the employees table.",
    "syntaxBreakdown": "DELETE FROM table_name\nWHERE condition;\nBreaking it down:\n\nDELETE FROM — The command that says \"I'm removing rows\"\ntable_name — Which table you're removing from\nWHERE — CRITICAL: Specifies which rows to delete (without it, ALL rows get deleted!)\nNotice what's missing: There's no column list. DELETE removes the entire row, not individual column values.",
    "basicExample": "Let's remove the test employee we added in Exercise 2 of the INSERT topic (Zara Chen, employee_id = 21).\n\nDELETE FROM employees\nWHERE employee_id = 21;\nWhat this does:\n\nFinds the employee with ID 21\nRemoves that entire row from the table\nAll columns (first_name, last_name, salary, etc.) are gone\nExpected output:\n\nQuery OK, 1 row affected\nVerify it's gone:\n\nSELECT * FROM employees WHERE employee_id = 21;\nExpected result: Empty set (0 rows) — the employee no longer exists.",
    "goingDeeper": "Deleting Multiple Rows\nJust like UPDATE, you can delete many rows at once:\n\nDELETE FROM projects\nWHERE budget IS NULL;\nWhat this does:\n\nFinds all projects where budget is NULL\nDeletes all of them\nIn our sample data, this removes \"Employee Training Portal\" (project_id = 11)\nExpected output:\n\nQuery OK, 1 row affected\nDeleting with Complex Conditions\nYou can use any valid WHERE condition, including multiple criteria:\n\nDELETE FROM employees\nWHERE salary < 60000.00 AND hire_date > '2023-01-01';\nWhat this does:\n\nFinds employees with salary under $60,000 AND hired after January 1, 2023\nRemoves those rows\nPause and Predict: Looking at our employee data, how many employees match this condition?\n\nAnswer",
    "commonMistakes": "Mistake #1: Forgetting WHERE (CATASTROPHIC!)\n-- WRONG — THIS DELETES EVERY EMPLOYEE!\nDELETE FROM employees;\nWhy it's catastrophic: Without WHERE, this removes EVERY row in the table. Your entire employee database is gone. The table structure remains, but it's empty.\n\nExpected output:\n\nQuery OK, 20 rows affected  -- Everything is gone!\nThis is the nuclear option. You almost never want this.\n\n-- CORRECT\nDELETE FROM employees\nWHERE employee_id = 16;  -- Only deletes Paul\nBest practice: Just like UPDATE, always write your WHERE clause first and test it with SELECT before running DELETE.\n\nMistake #2: Confusing DELETE with UPDATE\n-- WRONG — This tries to delete a salary, not an employee\nDELETE FROM employees\nWHERE salary = 68000.00;\nWhat beginners think this does: \"Delete the salary from Paul's record.\"\n\nWhat it actually does: Deletes the ENTIRE row for any employee with a salary of $68,000.\n\nThe fix: If you want to remove just a salary value (set it to NULL), use UPDATE:\n\n-- CORRECT\nUPDATE employees\nSET salary = NULL\nWHERE employee_id = 16;\nRemember: DELETE removes entire rows. UPDATE changes column values.\n\nMistake #3: Foreign Key Constraints Block Deletion\n--  MIGHT FAIL\nDELETE FROM departments\nWHERE department_id = 1;\nWhy it might fail: Department 1 (Engineering) has employees assigned to it (Bob, Alice, Jack, Leo, Quinn, and others). The employees table has a foreign key constraint pointing to departments.\n\nError message: Cannot delete or update a parent row: a foreign key constraint fails\n\nWhat this means: MySQL prevents you from deleting a department that still has employees, because that would leave employees pointing to a non-existent department.\n\nSolutions:\n\nFirst reassign or delete the employees\nOr set the foreign key to CASCADE (advanced topic for later)\n-- CORRECT approach\n-- First, reassign employees to another department or set to NULL\nUPDATE employees\nSET department_id = NULL\nWHERE department_id = 1;\n\n-- Now you can delete the department\nDELETE FROM departments\nWHERE department_id = 1;",
    "edgeCaseSpotlight": "DELETE with Subqueries\nYou can use a subquery in your WHERE clause to delete based on data from another table:\n\nDELETE FROM employee_projects\nWHERE project_id IN (\n    SELECT project_id \n    FROM projects \n    WHERE end_date < '2022-01-01'\n);\nWhat this does:\n\nThe subquery finds all projects that ended before 2022\nDELETE removes all employee assignments to those old projects\nThe projects themselves remain; we're just removing the assignments\nWhy this matters: You can delete rows based on relationships to other tables without needing to know the specific IDs.",
    "tryThis": "Exercise 1 (Guided)\nDelete all departments that have NULL in the location column.\n\nHint\nExercise 2 (Independent)\nDelete all employee assignments from the employee_projects table where the role is NULL.",
    "answerKey": "Exercise 1 Answer\nExercise 2 Answer",
    "quickRecap": "• DELETE removes entire rows from a table\n• Always use WHERE unless you want to delete everything (rare!)\n• Test your WHERE clause with SELECT before running DELETE\n• Foreign key constraints can prevent deletion if related data exists\n• DELETE removes the row; UPDATE sets values to NULL",
    "upNext": "Time for a Challenge! → Mini Challenge 1"
  }
}

export default lesson
