import User from "../../model/userModel.js";

//Get the list of users with pagination

const getUserList = async (req, res ) =>{
    try{
    const page = parseInt (req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

// Get total count fo pagination
 const totalUsers = await  User.countDocuments();
 const totalPages = Math.ceil(totalUsers / limit);

 const userList = await User.find()
 .sort({createdAt: -1})
 .skip(skip)
 .limit(limit)



 if(req.xhr){
    return res.render('admin/userList', {
        userList,
    pagination:{
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
    }
})
}
res.render('admin/userList', {
    userList,
    pagination:{
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
    }       
    })
    }catch(error){
        console.error(error)
        if(req.xhr){
            return res.status(500).json({error: 'Failed to fetch users'})
        }
    res.status(500).send('server error')
}
}


const getToggle = async (req ,res)=>{
    console.log(req.body)
    try{
        const userId = req.body.userId;
        const user = await User.findById(userId)


        if(!user){
            return res.status(404).json({error: 'User not found'})
        }

user.blocked = !user.blocked;
await user.save();

// Return JSON response for API calls
if(req.xhr|| req.headers.accept.includes('json') > -1){
    return res.json({
        success: true,
        message: `User successfully ${user.blocked ? 'blocked' : 'unblocked'}`
    })
}

res.redirect('/admin/userList')
    }catch(error){
        if(req.xhr || req.headers.accept.includes('json') > -1){
            return res.status(500).json({error: 'Failed to update user status'})
        }
        res.status(500).send('Server error')
    }
}

export default {getUserList, getToggle}