const express = require('express')
const bodyParser = require("body-parser");
const cors = require('cors');
const mysql = require('promise-mysql');
const app = express();
const { check, validationResult } = require('express-validator');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');

app.set('view engine', 'ejs')

//parse application
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());

var pool;
//Connection to mysql
mysql.createPool({
    connectionLimit: 3,
    host: "localhost",
    user: "root",
    password: "",
    database: 'proj2022'
})
    .then(p => {
        pool = p
    }).catch(e => {
        console.log("pool error:" + e)
    });

    //get home page
    app.get('/', (req, res) => {


    res.render("home", { errors: undefined });
});


// Employee List Page
app.get('/employees', (req, res) => {
    pool.query("select * from employee").then((d) => {
        res.render("employees", { employees: d })
    }).catch((error) => {
        res.send(error)
    })
});

// Edit Employee Page
app.get('/employees/edit/:eid',
    (req, res) => {
        pool.query("SELECT * FROM employee e WHERE e.eid = '" + req.params.eid + "'").then((d) => {
            res.render("editEmployee", { e: d[0], errors: undefined })
        }).catch((error) => {
            res.send(error)
        })
    }
);

// Requirements

app.post('/employees/edit/:eid',
    [
        check("name").isLength({ min: 5 }).withMessage("Employee Name must be 5 characters long")
    ],
    [
        check("role").isIn(["Manager", "Employee"]).withMessage("Role can be either Manager or Employer")
    ],
    [
        check("salary").isFloat({ gt: 0 }).withMessage("Salary must be > 0")
    ],
    (req, res) => {
        const errors = validationResult(req)

        let data = {};
        data.eid = req.params.eid;
        data.ename = req.body.name;
        data.role = req.body.role;
        data.salary = req.body.salary;

        // If data is incorrect doesnt input into file
        if (!errors.isEmpty()) {
            res.render("editEmployee", { e: data, errors: errors.errors })
        }
        else {
            pool.query(`UPDATE employee SET ename='${req.body.name}', role='${req.body.role}', salary='${req.body.salary}' WHERE eid = '${req.params.eid}'`).then((d) => {
                res.redirect("/employees")
            }).catch((error) => {
                res.send(error)
            })
        }
    }
);

// Deptartments page
app.get('/departments', (req, res) => {
    pool.query("SELECT dept.did,dept.dname,loc.county,dept.budget FROM dept JOIN location AS loc ON loc.lid = dept.lid").then((d) => {
        res.render("departments", { departments: d })
    }).catch((error) => {
        res.send(error)
    })
});

app.get('/departments/delete/:did', (req, res) => {
    pool.query(`DELETE FROM dept WHERE did = '${req.params.did}';`).then((d) => {
        res.redirect("/departments")
    }).catch(() => {
        res.status(400).send(
            `<div>
                <h1>Error Message</h1>
                <h2>${req.params.did} has Employees and cannot be deleted</h2>
                <a href="/departments">Home</a>
            </div>`)
    })
});

/* MongoDB */
const url = 'mongodb+srv://Kaif:Tahir@dcwa.exdszr1.mongodb.net/test';
const dbName = 'employeesdb'
const colName = 'employees'

var employeesDB
var employees

MongoClient.connect(url, { useNewUrlParser: true })
    .then((client) => {

        employeesDB = client.db(dbName)
        employees = employeesDB.collection(colName)
    })
    .catch((error) => {
        console.log(error)
    });

function getEmployees(){
    return new Promise((resolve, reject)=>{
        
        var cursor = employees.find()
   
        cursor.toArray()
   
        .then((documents)=>{
           
           resolve(documents)
   
        })
        .catch((error)=>{
            reject(error)
        })
   
       
       })
}

app.get('/employeesMongoDB', (req, res) => {
    getEmployees()
        .then((documents) => {
            res.render('employeesMongo', { employees: documents })
        })
        .catch((error) => {
            res.send(error)
        })
})    

function addEmployee(_id, phone, email){
    return new Promise((resolve, reject)=>{
        employees.insertOne({"_id":_id,"phone":phone,"email":email})
        
        .then((result)=>{
           
           resolve(result)
   
        })
        .catch((error)=>{
            reject(error)
        })
   
       
       })
}

app.get('/addEmployee', (req, res)=>{
    res.render("addEmployee")
})

app.post('/addEmployee', (req, res)=>{
    addEmployee(req.body._id, req.body.phone, req.body.email)
    .then((result)=>{
        res.redirect("/employeesMongoDB")
    })
    .catch((error) => {
        res.send(error)
    })
})



app.listen(3000, () => {
    console.log("Listening on port 3000")
});

console.log("Working")