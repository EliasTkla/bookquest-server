const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const db = require("./config/db");
var bcrypt = require('bcryptjs');
require('dotenv').config();

const jwt = require('jsonwebtoken');

app.use(
    cors({
        origin: "https://bookq.netlify.app",
        methods: ["GET", "PUT", "POST", "DELETE"],
    })
);

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())

app.get("/check", (req, res) => {
    const sqlSelect = "SELECT * FROM user_books";
    db.query(sqlSelect, (err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0) {
            res.send("books logged");
        } else {
            res.send("no books logged");
        }  
    });
});

app.post("/userInfo", (req, res) => {
    const email = req.body.email;
    const verifyPwd = req.body.verifyPwd;

    const sqlSelect = "SELECT * FROM users WHERE email = ?";
    db.query(sqlSelect, [email], async(err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0) {
            if(verifyPwd !== undefined){
                const comparison = await bcrypt.compare(verifyPwd, result[0].password);
                if(comparison){
                    res.send({message1: "success"});
                } else {
                    res.send({message2: "wrong password"});
                }
            } else {
                result[0].password = "password";
                res.send(result);
            }
        } else {
            res.send({message: "Problem getting user info!"});
        }
    });
});

app.post("/bookLogged", (req, res) => {
    const email = req.body.email;
    const bookId = req.body.bookId;
    
    const sqlSelect = "SELECT * FROM user_books WHERE email = ? AND book_id = ?";
    db.query(sqlSelect, [email, bookId], (err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0){
            res.send({message1: "Book logged"});
        } else {
            res.send({message: "Book not logged"});
        }
    });
});

app.post("/books", (req, res) => {
    const email = req.body.email;

    const sqlSelect = "SELECT * FROM user_books WHERE email = ?";
    db.query(sqlSelect, [email], (err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0) {
            res.send(result);
        } else {
            res.send({message: "You have no books logged!"});
        }  
    });
});

app.post("/register", async(req, res) => {
    const email = req.body.email;
    const usern = req.body.usern;
    const pwd = req.body.pwd;

    const sqlIn = "SELECT * FROM users WHERE email = ? || username = ?";
    db.query(sqlIn, [email, usern], async (err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0) {
            if(result.length < 2){
                if(result[0].email === email &&  result[0].username === usern){
                    res.send({message: "Email and Username already in use!"});
                } else if(result[0].email === email &&  result[0].username !== usern){
                    res.send({message: "Email already in use!"});
                } else if(result[0].email !== email &&  result[0].username === usern){
                    res.send({message: "Username already in use!"});
                }
            } else if(result.length > 1){
                if(result[0].email === email &&  result[1].username === usern || result[1].email === email &&  result[0].username === usern){
                    res.send({message: "Email and Username already in use!"});
                } else if(result[0].email === email &&  result[0].username === usern ){
                    res.send({message: "Email and Username already in use!"});
                } else if(result[0].email === email &&  result[0].username !== usern){
                    res.send({message: "Email already in use!"});
                } else if(result[0].email !== email &&  result[0].username === usern){
                    res.send({message: "Username already in use!"});
                }else if(result[1].email === email &&  result[1].username === usern){
                    res.send({message: "Email and Username already in use!"});
                } else if(result[1].email === email &&  result[1].username !== usern){
                    res.send({message: "Email already in use!"});
                } else if(result[1].email !== email &&  result[1].username === usern){
                    res.send({message: "Username already in use!"});
                }
            }

        } else {
            const sqlInsert = "INSERT INTO users(email, username, password) VALUES (?, ?, ?)";
            const saltRounds = await bcrypt.genSalt(10);
            const encryptedPwd = await bcrypt.hash(pwd, saltRounds);

            db.query(sqlInsert, [email, usern, encryptedPwd], (err, result) => {
                if(err){
                    res.send({err: err});
                }
                
                res.send({message1: "User registered successfully!"});
            });
        }
    });
});

app.post("/login", async(req, res) => {
    const usern = req.body.usern;
    const pwd = req.body.pwd;

    const sqlInsert = "SELECT * FROM users WHERE username = ?";
    db.query(sqlInsert, usern, async (err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0) {
            const comparison = await bcrypt.compare(pwd, result[0].password);
            
            if(comparison){
                const id = result[0].id;
                const email = result[0].email;
                const username = result[0].username;
                const token = jwt.sign({id: id}, "jwtsecret");

                res.json({token: token, email: email, username: username});
            } else {
                res.json({message:"Incorrect username or password"});
            }
            
        } else {
            res.json({message:"Incorrect username or password"});
        }
    });
});

app.post("/editlog", (req, res) => {
    const email = req.body.email;
    const bookId = req.body.bookId;
    
    const sqlIn = "SELECT * FROM user_books WHERE email = ? AND book_id = ?"
    db.query(sqlIn, [email, bookId], (err, result) => {
        if(err){
            res.send({err: err});
        }

        if(result.length > 0) {
            const sqlInsert = "DELETE FROM user_books WHERE email = ? AND book_id = ?"
            db.query(sqlInsert, [email, bookId], (err, result) => {
                if(err){
                    res.send({err: err});
                }
                
                res.send({message1: "Book unlogged"});
            });
        } else {
            const sqlInsert = "INSERT INTO user_books(email, book_id) VALUES (?, ?)"
            db.query(sqlInsert, [email, bookId], (err, result) => {
                if(err){
                    res.send({err: err});
                }
                
                res.send({message2: "Book logged"});
            });
        }
    });
});

app.put("/updateUserInfo", (req, res) => {
    const email = req.body.email;
    const newUsername = req.body.newUsername;
    const newPwd = req.body.newPwd;

    const sqlIn = "SELECT * FROM users WHERE username = ? ";
    db.query(sqlIn, [newUsername], async (err, result) => {
        if(err){
            res.send({err: err});
        }
        
        if(result.length > 0) {
            if(result[0].email === email) {
                const sqlInsert = "UPDATE users SET password = ? WHERE email = ? AND username = ?";
                const saltRounds = await bcrypt.genSalt(10);
                const encryptedPwd = await bcrypt.hash(newPwd, saltRounds);

                db.query(sqlInsert, [encryptedPwd, email, newUsername], (err, result) => {
                    if(err){
                        res.send({err: err});
                    }

                    res.send({message1: "Updated password!"});
                });
            } else {
                res.send({message: "Username already in use!"});
            }
            
        } else {
            const sqlInsert = "UPDATE users SET username = ?, password = ? WHERE email = ?";
            const saltRounds = await bcrypt.genSalt(10);
            const encryptedPwd = await bcrypt.hash(newPwd, saltRounds);

            db.query(sqlInsert, [newUsername, encryptedPwd, email], (err, result) => {
                if(err){
                    res.send({err: err});
                }

                res.send({message2: "Updated username and password"});
            });
        }
    });
}); 


app.listen(process.env.PORT || 3001, () => { 
    console.log('Server started on port 3001');
});