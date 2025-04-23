import express from "express"
import dotenv from 'dotenv';
import cors from "cors"
import mongoose from "mongoose";

dotenv.config();
// console.log(process.env.MONGO_URL)
const PORT = process.env.PORT;

const app = express()


app.use(cors())
app.use(express.json());


const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,

        default: null
    },


    name: String,
    profileImage: String,
    createdAt: {
        type: Date,
        default: new Date()
    },
    deviceToken: {
        type: String,
        default: null
    }

})



const PostSchema = new mongoose.Schema({
    email: {

        required: true,
        type: String
    },
    question: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    isPrivate: {
        type: Boolean,
        default: false
    }
})

const ReplySchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true

    },
    content: {
        type: String,
        required: true,

    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    userId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: new Date()
    }

})


const Post = mongoose.model('Post', PostSchema)
const Reply = mongoose.model('Reply', ReplySchema)
const User = mongoose.model("userSchema", UserSchema)



app.post("/createUser", async (req, res) => {


    try {

        const { googleId, name, email, profileImage, userName = "" } = req.body
        console.log(googleId, name, email, profileImage);


        const existingUser = await User.findOne({ googleId })


        if (existingUser) {
            return res.status(200).json({
                message: "user already exists",
                user: existingUser
            })

        }

        const newUser = new User({
            googleId, email
            , name, profileImage
        })

        await newUser.save()

        res.status(201).json({
            message: "user created",

            user: newUser
        })

    } catch (err) {
        console.log(err)
        res.send("Error while creating user ")
    }








})


app.post('/updateUserName', async (req, res) => {

    try {

        const { email, userName } = req.body;


        const user = await User.updateOne({ email }, {
            $set: { userName }
        })
        res.status(200).json({
            message: "username updated",
            user
        })
    } catch (err) {
        console.log(err)
        res.status(404).json({
            message: "error while updating username"
        })
    }





})


app.post("/getUserByUserName", async (req, res) => {
    const { userName } = req.body;

    console.log("userName", userName)
    if (!userName) {
        return res.status(404).json({
            message: "please give me user name "
        })

    }
    try {

        const user = await User.findOne({ userName })
        if (!user) {
            return res.status(202).json({
                message: "no user found"
            })
        }

        const TotalPost=await Post.countDocuments();


        const postByUser = await Post.find({ email: user.email }).limit(10)
        .sort({ createdAt: -1 })



        res.status(200).json({
            user: {
                user
            },
            postByUser,
            TotalPostByUser: TotalPost
        })



    } catch (err) {
        console.log(err)
        res.status(404).json({
            message: "No user found with this userName "
        })
    }







})

app.post("/createPost", async (req, res) => {
    try {

        const { question, email, isPrivate = false } = req.body

        if (!question || !email) {
            return res.status(200).json({
                message: "question or email should not be null"
            })
        }
        const post = await Post.create({
            email: email,
            question: question,
            isPrivate
        })
        res.status(201).json({
            message: "post sucessfully created...",
            post
        })




    } catch (err) {
        console.log(err)
        res.status(404).json({
            message: "Sorry error while creating your posts"
        })
    }
})


app.get("/getAllLatesQuestion", async (req, res) => {
    const { page = 1 } = req.body;
    try {

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * 5)
            .limit(5);
        // Sort by createdAt descending (newest first)

        const total = await Post.countDocuments()

        res.status(200).json({
            message: "sucessfully fetched",
            Total: total,
            posts
        })
    } catch (err) {
        res.status(200).json({
            message: "Sorry error while fetching the data..."
        })
    }
})


app.get("/getQuestionInformationById", async (req, res) => {

    try {
        const { id } = req.query
        console.log(id)
        const question = await Post.findById(id)

        if (!question) {
            return res.status(200).json({
                message: "there is no such ID"
            })
        }
        const owner = await User.findOne({ email: question.email })

        const reply = await Reply.find({
            postId: id
        })

        // Get all the replies of this specific question






        res.status(200).json({
            message: "successfully fetched",
            data: {
                question
            },
            owner,
            reply
        })



    } catch (err) {
        console.error(err)
        res.status(200).json({
            message: "sorry there is an error while fetching details about your question"
        })

    }
})


app.post("/sendOpinion", async (req, res) => {

    try {

        const { content, postId } = req.body;

        if (!content || !postId) {
            return res.status(200).json({
                message: "please give me p"
            })
        }
        const reply = await Reply.create({
            postId,
            content
        })
        res.status(200).json({
            message: "successfully posted",
            reply
        })






    } catch (err) {
        console.error(err)
        res.status(200).json({
            message: "please give me content or post Id"
        })
    }




})

app.post("/checkUserName", async (req, res) => {
    const { userName, email = "" } = req.body;
  
    // Step 1: Validate input
    if (!userName || !email) {
      return res.status(400).json({
        message: "Please provide both username and email",
      });
    }
  
    try {
      // Step 2: Check if another user (not current one) has the same userName
      const isUserNameTaken = await User.findOne({
        userName,
        email: { $ne: email }, // exclude current user's email
      });
  
      if (isUserNameTaken) {
        return res.status(409).json({
          message: "Sorry, username not available",
        });
      }
  
      // Step 3: Update current user's username
      const updatedUser = await User.findOneAndUpdate(
        { email },
        { userName },
        { new: true } // return the updated document
      );
  
      if (!updatedUser) {
        return res.status(404).json({
          message: "User with this email not found",
        });
      }
  
      // Step 4: Return success response
      return res.status(200).json({
        message: "Username updated successfully",
        updatedUser,
      });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Something went wrong while updating username",
      });
    }
  });
  

app.post("/getUserByEmail",async(req,res)=>{
const {email}=req.body
if(!email){
    return res.status(200).json({
        message:"Please send Your email"
    })
}

    try{

     const user=   await User.findOne({email})
     

     if(!user){
        return res.status(404).json({
            message:"no user found"
        })
     }
     res.status(200).json({
        message:"Found user",
        user
     })


    }catch(err){
        console.error(err)
        res.status(404).json({
            message:"error while  fetching data"
        })

    }


})  
// app.get("/getUserName",())





// connect DATABASE
async function ConnectDb() {
    try {

        const res = await mongoose.connect(process.env.MONGO_URL)
        // console.log(res)
    } catch (err) {
        console.log(" Error while connecting to the database")
    }
}
ConnectDb()









app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})