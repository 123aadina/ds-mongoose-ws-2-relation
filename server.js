const express = require('express');
const app = express();
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Schema = mongoose.Schema

// connect to mongo db with all this strange options
// so you do not get all these annyoing warnings on connecting
mongoose.connect('mongodb://localhost/users_db', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection succeeded')
    } else {
        console.log('Error on DB connection: ' + err)
    }
});

// Create User Model

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    roles: [String]
});

const User = mongoose.model('User', UserSchema)


const ToDoSchema = new mongoose.Schema({
    title: {type:String, required: true}, 
    status: {type: String,  enum: ["OPEN", "IN PROCESS", "DONE", "ON HOLD", "CANCELED"], default: "OPEN"},
    user : {ref: "User", type: Schema.Types.ObjectId }
});

const ToDo = mongoose.model("ToDo",ToDoSchema )

 // 1 user - n todos
 // 1 user - 1 todo
 // 1 - n



// parse incoming JSON data (from fetch or browser client)
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/users/seed', (req, res) => {

    // array of users to create
    let users = [
        {email: "admin@dci.de", password: "OPEN", roles: ['Admin']},
        {email: "user1@dci.de", password: "DONE", roles: ['Guest']},
        {email: "user2@dci.de", password: "IN PROCESS", roles: ['Reader', 'Editor']},
    ]


    let TOdO = [
        {title: "coding", status: "OPEN", user: user._id},
        {title: "teaching", status: "OPEN", user: user._id},
        {title: "manger", status: "OPEN", user: user._id},
        
    ]
    // hash password for each user (using bcrypt)
    let usersHashed = users.map(user => {
        user.password = bcrypt.hashSync(user.password, 10)
        return user
    })

    // insert users into MongoDB
    User.insertMany(usersHashed)
    .then(usersNew => res.send(usersNew)) 
})


app.get("/user/:id/todos/seed",(req, res)=>{
    const id =req.params.id

      User.findById(id).then(user=>{
        ToDo.insertMany({
            title: "title",
            status: "OPEN",
            user: user._id
        }).then(todos=>{
            console.log(todos)
            res.send(todos)
        })
       
    })
    //.catch(err => next(err))
})

// handle incoming LOGIN requests here....
app.post('/login', (req, res, next) => {

    // find user
    User.findOne({email: req.body.email}).then(user => {
        // user with this email not found? => error
        if(!user) {
            return next(`Authentication failed`)
        }

        // compare passwords using bcrypt.compare() function
        bcrypt.compare(req.body.password, user.password)
        .then(success => {
            // user password does not match password from login form? => error
            if(!success) {
                return next(`Authentication failed`)
            }
            // create JWT token by signing
            let secret = "jwt-master-secret"
            let token = jwt.sign(
                {id: user.id, email: user.email}, // WHAT data to sign
                secret, // signing key
                { expiresIn: "1h" } // expiry time
            )
    
            // return token
            res.send({ token }) // => same as: { "token": token }
        })
    })
    .catch(err => next(err))
})


let port = 3000
app.listen(port, () => {
    console.log(`Server listening on port ${port}!`);
});

//Run app, then load http://localhost:port in a browser to see the output.
