const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');  // User schema
const Ticket = require('../models/Ticket');
const crypto = require('crypto'); 
const nodemailer=require('nodemailer')
const router = express.Router();
let userOTPStore = 0;
// Sign-up route
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      
    });

    await newUser.save();
    const otp = crypto.randomInt(1000, 9999); // Generate a 4-digit OTP
  userOTPStore = otp;
  const transporter = await nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email, 
    subject: "Thank You for Reaching Out!",
    html: `<p>Welcome to our website  <b>${name},</b></p>
    
    <p>Your OTP for verification is ${otp}</p>
    
   
   `
};

await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log(error);
        res.send("Error");
    } else {
        console.log("Email sent: " + info.response);
        
    }
});

res.status(200).json({ message: 'Registration successful! Check your email for the OTP.'});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
    console.log(err)
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // Check if OTP is correct
  if (parseInt(otp) === userOTPStore) {
    // Update user status to verified in the database (pseudo code)
   

    res.status(200).json({ message: 'OTP verified successfully! You can now log in.' });
  } else {
    res.status(400).json({ error: 'Invalid OTP. Please try again.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
console.log(email)
console.log(password)
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    console.log(user)

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch)
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


router.post("/tickets", async (req, res) => {
    const { title, description, email } = req.body;
  
    try {
      // Find the user's name by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Create a new ticket with the user's name and other details
      const newTicket = new Ticket({
        title,
        description,
        userEmail: email,
        userName: user.name,
        createdAt: new Date(),
      });
  
      await newTicket.save();


      const transporter = await nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email, 
        subject: "Thank You for Reaching Out!",
        html: `<p>Dear <b>${user.name},</b></p>
        
        <p>Thank you for getting in touch! I’ve received your message and appreciate your interest in connecting. I'm committed to responding promptly, so you can expect a reply from me soon.</p>
        
        <p>If you have any additional questions or need more information in the meantime, please feel free to reply directly to this email. I’m here to help!</p>
        
        <p>Looking forward to speaking with you soon.</p>
        
        <p>Warm regards,<br>
        Ayush Rai<br>
        Help Desk<br>
       `
    };
    
    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send("Error");
        } else {
            console.log("Email sent: " + info.response);
            
        }
    });
    
      res.status(201).json(newTicket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  router.get("/tickets", async (req, res) => {
    try {
      const {email}=req.query;
      console.log(email)
      const tickets = await Ticket.find({userEmail:email}).sort({ createdAt: -1 }); // Sort by createdAt in descending order
      res.status(200).json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Server error while fetching tickets" });
    }
  });
  router.get("/ticketsadmin", async (req, res) => {
    try {
      
      const tickets = await Ticket.find().sort({ createdAt: -1 }); // Sort by createdAt in descending order
      res.status(200).json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Server error while fetching tickets" });
    }
  });
  
  router.get("/user", async (req, res) => {
    const { email } = req.query;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // PUT update user details
  router.put("/user", async (req, res) => {
    const { name, email, phone } = req.body;
    try {
      const updatedUser = await User.findOneAndUpdate(
        { email },
        { name, phone },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });


  router.get('/customers', async (req, res) => {
    try {
      const customers = await User.find({ role: 'customer' }).select('name email createdAt'); // Select only necessary fields
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  router.get('/agent', async (req, res) => {
    try {
      const customers = await User.find({ role: 'agent' }).select('name email createdAt'); // Select only necessary fields
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });


  router.patch('/ticketscustomer/:id', async (req, res) => {
    try {
      console.log(req.body);
      const { title, description, email, feedback, satisfied } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Prepare the 'lastUpdatedBy' object with user's name and role
      const lastUpdatedBy = {
        name: user.name,
        role: user.role,
      };
  
      // Determine the updated fields for the ticket
      const updateFields = {
        title,
        description,
        feedback,
        satisfied,
        lastUpdated: Date.now(),
        lastUpdatedBy,  // Add the 'lastUpdatedBy' field
      };
  
      // If 'satisfied' is 'Yes', set the status to 'closed'
      if (satisfied === 'Yes') {
        updateFields.status = 'closed';
      }
  
      // Update the ticket with the new details, including 'lastUpdatedBy' and 'status' if applicable
      const updatedTicket = await Ticket.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }  // Return the updated ticket after modification
      );
  
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      if(satisfied=="Yes"){
        const transporter = await nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });
      
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email, 
          subject: "Thank You for Reaching Out!",
          html: `<p>Dear <b>${user.name},</b></p>

<p>Thank you for your response! We're thrilled to hear that you had a positive experience with the action we took. Your feedback is incredibly valuable to us, and we're so glad that we could meet your expectations.</p>

<p>If you have any more suggestions, ideas, or ways we can further improve, please don't hesitate to reach out. We're always here to listen and enhance your experience.</p>

<p>Once again, thank you for your kind words and for being such a great part of our community.</p>

<p>Warm regards,<br>
Ayush Rai<br>
Help Desk<br>
`

          
      };
      
      await transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log(error);
              res.send("Error");
          } else {
              console.log("Email sent: " + info.response);
              
          }
      });
        

      }
      else{
        const transporter = await nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });
      
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email, 
          subject: "Thank You for Reaching Out!",
          html: `<p>Dear <b>${user.name},</b></p>

          <p>Thank you for sharing your thoughts. We're sorry to hear that the solution we provided didn't fully meet your expectations. Your feedback is important to us, and we sincerely apologize for any inconvenience this may have caused.</p>
          
          <p>We are committed to improving and would love to understand more about what went wrong or how we can address your concerns more effectively. Please feel free to reply directly to this email with any additional details or suggestions you may have.</p>
          
          <p>We value your feedback and will work hard to ensure a better experience moving forward.</p>
          
          <p>Thank you for bringing this to our attention. We’re here to assist you further and resolve any remaining issues.</p>
          
          <p>Warm regards,<br>
          Ayush Rai<br>
          Help Desk<br>
          `
          
          
      };
      
      await transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log(error);
              res.send("Error");
          } else {
              console.log("Email sent: " + info.response);
              
          }
      });

      }
  
      res.json(updatedTicket);  // Return the updated ticket data
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating ticket' });
    }
  });
  
router.patch('/ticketstaff/:id', async (req, res) => {
  try {
    const { title, description, status, actionTaken, lastUpdated, email } = req.body;
console.log(req.body)
    // Fetch the user from the User collection using the provided email
    const user = await User.findOne({ email });
    
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare the 'lastUpdatedBy' object with user's name and role
    const lastUpdatedBy = {
      name: user.name,
      role: user.role,
    };

    // Update the ticket with the new details, including 'lastUpdatedBy'
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        title, 
        description, 
        status, 
        actionTaken, 
        lastUpdated, 
        lastUpdatedBy,  // Add the 'lastUpdatedBy' field
      },
      { new: true }  // Return the updated ticket
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if(actionTaken){
      const transporter = await nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email, 
        subject: "Thank You for Reaching Out!",
        html: `<p>Dear <b>${user.name},</b></p>

        <p>Thank you for reaching out! We wanted to inform you that we've taken action on your request. Your input is invaluable to us, and we strive to ensure a seamless experience for you.</p>
        
        <p>Now, we would love to hear your feedback. Please let us know if the solution provided met your expectations or if there's anything further we can assist you with.</p>
        
        <p>You can reply directly to this email with your feedback or any additional questions you may have. Your insights help us continually improve our service.</p>
        
        <p>Thank you once again for your time and trust.</p>
        
        <p>Warm regards,<br>
        Ayush Rai<br>
        Help Desk<br>
        `
        
    };
    
    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send("Error");
        } else {
            console.log("Email sent: " + info.response);
            
        }
    });
    }
    res.json(updatedTicket);  // Return the updated ticket data
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating ticket' });
  }
});
router.get('/customer-growth', async (req, res) => {
  try {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Create an array to store the count of customers per month
    const customerCounts = Array(12).fill(0);

    // Get all customers who registered in the current year (role = 'customer')
    const customers = await User.find({
      role: "customer",  // Filter by customer role
      createdAt: {
        $gte: new Date(currentYear, 0, 1),  // January 1st of the current year
        $lt: new Date(currentYear + 1, 0, 1),  // January 1st of the next year
      },
    });

    // Count customers per month
    customers.forEach(customer => {
      const month = customer.createdAt.getMonth();  // 0 - 11 (January - December)
      customerCounts[month] += 1;
    });

    res.json(customerCounts);  // Return the array of customer counts for each month
  } catch (error) {
    console.error("Error fetching customer growth data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
  

router.get('/ticket-growth', async (req, res) => {
  try {
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Create an array to store the count of tickets per month
    const ticketCounts = Array(12).fill(0);

    // Get all tickets created in the current year
    const tickets = await Ticket.find({
      createdAt: {
        $gte: new Date(currentYear, 0, 1),  // January 1st of the current year
        $lt: new Date(currentYear + 1, 0, 1),  // January 1st of the next year
      },
    });

    // Count tickets per month
    tickets.forEach(ticket => {
      const month = ticket.createdAt.getMonth();  // 0 - 11 (January - December)
      ticketCounts[month] += 1;
    });

    res.json(ticketCounts);  // Return the array of ticket counts for each month
  } catch (error) {
    console.error("Error fetching ticket growth data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/ticket-counts", async (req, res) => {
  try {
    const activeCount = await Ticket.countDocuments({ status: "active" });
    const pendingCount = await Ticket.countDocuments({ status: "pending" });
    const closedCount = await Ticket.countDocuments({ status: "closed" });

    res.json({ active: activeCount, pending: pendingCount, closed: closedCount });
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket counts", error });
  }
});


router.post('/signupagent', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      role:"agent"
    });

    await newUser.save();
  
res.status(200).json({ message: 'Registration successful! Check your email for the OTP.'});
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
    console.log(err)
  }
});
module.exports = router;
