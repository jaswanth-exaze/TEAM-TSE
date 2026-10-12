// Extracted lesson content for the min-max topic.
const lesson = {
  "id": "min-max",
  "status": "reference",
  "sourceTitle": "Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)",
  "sourceDocuments": [
    {
      "title": "Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)",
      "part": 1,
      "topicNumber": 11,
      "difficulty": "Beginner",
      "prerequisites": "select-from-where"
    }
  ],
  "relatedTopicId": "count",
  "sections": {
    "whatIsIt": "Aggregate Functions\nAggregate functions perform calculations across multiple rows and return a single result. Instead of showing every row, they summarize data: COUNT how many rows, SUM totals, AVG calculates averages, MIN/MAX find extremes.\n\nReal-world analogy: Instead of listing every employee's salary, answer \"What's the total payroll?\" or \"What's the average salary?\"\n\nThe Five Core Aggregate Functions\nFunction\tWhat It Does\tExample\nCOUNT()\tCounts rows\tHow many employees?\nSUM()\tAdds up values\tWhat's total payroll?\nAVG()\tCalculates average\tWhat's average salary?\nMIN()\tFinds minimum value\tWho has lowest salary?\nMAX()\tFinds maximum value\tWho has highest salary?",
    "syntaxBreakdown": "",
    "basicExample": "MIN and MAX — Find Extremes\nLowest and highest salaries:\n\nSELECT \n    MIN(salary) AS lowest_salary,\n    MAX(salary) AS highest_salary\nFROM employees;\nExpected output:\n\nlowest_salary\thighest_salary\n55000.00\t120000.00\nYou can use multiple aggregates in one query!",
    "goingDeeper": "Combining Aggregates\nGet a complete salary summary:\n\nSELECT \n    COUNT(*) AS total_employees,\n    COUNT(salary) AS employees_with_salary,\n    SUM(salary) AS total_payroll,\n    AVG(salary) AS average_salary,\n    MIN(salary) AS min_salary,\n    MAX(salary) AS max_salary\nFROM employees;\nExpected output:\n\ntotal_employees\temployees_with_salary\ttotal_payroll\taverage_salary\tmin_salary\tmax_salary\n20\t18\t1633000.00\t90722.22\t55000.00\t120000.00\nPowerful summary in one query!",
    "commonMistakes": "Mistake #3: NULL + Anything = NULL in Arithmetic\nSELECT SUM(salary) / COUNT(*) AS incorrect_average\nFROM employees;\nWhat you get: 81,650.00\n\nWhat you expected: 90,722.22 (the real average)\n\nWhy different? COUNT(*) counts all 20 employees, including 2 with NULL salaries. But SUM(salary) only adds the 18 non-NULL salaries. So you're dividing by 20 instead of 18.\n\nThe fix: Use AVG() which handles NULLs correctly:\n\n-- CORRECT\nSELECT AVG(salary) AS correct_average\nFROM employees;",
    "edgeCaseSpotlight": "Aggregates on Empty Result Sets\nSELECT COUNT(*), SUM(salary), AVG(salary), MIN(salary), MAX(salary)\nFROM employees\nWHERE department_id = 999;  -- No such department\nExpected output:\n\nCOUNT(*)\tSUM(salary)\tAVG(salary)\tMIN(salary)\tMAX(salary)\n0\tNULL\tNULL\tNULL\tNULL\nKey points:\n\nCOUNT(*) returns 0 (zero rows found)\nAll other aggregates return NULL (can't sum/average/min/max nothing)\nWhy this matters: Your application should handle NULL results from aggregates when no rows match.",
    "tryThis": "Exercise 3 (Challenge)\nFind the earliest hire date and the most recent hire date among all employees. Label them as first_hire and most_recent_hire.\n\nHint",
    "answerKey": "Exercise 3 Answer",
    "quickRecap": "• MIN()/MAX() find smallest/largest values",
    "upNext": "Next topic: GROUP BY → part1_12_group_by.md\n\nYou can summarize ALL data. Next, you'll learn how to summarize data BY CATEGORY — like average salary per department!"
  }
}

export default lesson
