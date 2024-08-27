const express=require('express')
const sqlite=require('sqlite')
const sqlite3=require('sqlite3')
const {open}=require('sqlite')
const cors=require('cors')
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken')
const app=express()

app.use(cors({
    origin:'http://localhost:3000',
    methods:['GET','POST'],
    allowedHeaders:['Content-Type']
}))

const path=require('path')
const dbPath=path.join(__dirname,'users.db')

app.use(express.json())

let db=null

const initiateAndStartDatabaseServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3000,()=>{
            console.log('Backend server is runnig at http://localhost:3000/')
        })
    }
    catch (e){
      console.log(`DB Error ${e.message}`)
      process.exit(1)
    }
}


initiateAndStartDatabaseServer()


app.post('/users',async(req,res)=>{
    const {username,password}=req.body
    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery=`insert into users (username,password)
        values (?,?)`
        await db.run(insertQuery,[username,hashedPassword])
        res.status(201).json({message:'user created successfully'})
    } catch (e){
        console.log(`Failed to creating, ${e.message}`)
        res.status(501).json({error:'failed to create user'});
    }
})

app.get('/users',async(req,res)=>{
    try{
        const getUsersQuery=`select * from users;`
        response=await db.all(getUsersQuery)
        res.send(response)
    } catch (e){
        console.log('error fetching the data',e.message)
        res.status(501).json({error:'failed to get users data'})
    }
})

app.post('/login',async(req,res)=>{
    const {username,password}=req.body
    const userSelectQuery=`select * from users where username=?`
    const dbUser=await db.get(userSelectQuery,[username])
    if(dbUser===undefined){
        res.status(400)
        res.send("Invalid username")
    }
    else{
        const isPasswordMatched=await bcrypt.compare(password,dbUser.password)
        if(isPasswordMatched===true){
            const payload={
                username:username
            }
            const jwtToken=jwt.sign(payload,'my_secret_token')
            res.send({jwtToken})
        }else{
            res.status(400)
            res.send("invalid password")
        }
    }
})



app.delete('/users',async(req,res)=>{
    try{
        const deleteQuery='delete from users;'
        await db.run(deleteQuery)
        res.status(201).json({message:'deleted successfully'})
    }
    catch (e){
        res.status(501).json({error:'failed to delete'})
    }
})