if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const PDFDocument = require('pdfkit');
const { Table } = require('pdfkit-table');
const fs = require('fs');
const { type } = require("os");
const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates').EmailTemplate;

const passportStudent = require('passport');
const passportInstructor = require('passport');
const passportAdmin = require('passport');

const initializePassportStudent = require('./passport-config-student');
const initializePassportInstructor = require('./passport-config-instructor');
const initializePassportAdmin = require('./passport-config-admin');

const { query } = require('express');

initializePassportStudent(
    passportStudent,
    email => Student.findOne({ email: email }),
    id => id
);

initializePassportInstructor(
    passportInstructor,
    email => Instructor.findOne({ email: email }),
    id => id
);

initializePassportAdmin(
    passportAdmin,
    email => Admin.findOne({ email: email }),
    id => id
);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passportStudent.initialize());
app.use(passportStudent.session());

app.use(passportInstructor.initialize());
app.use(passportInstructor.session());

app.use(passportAdmin.initialize());
app.use(passportAdmin.session());

app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://devarsh_nagrecha:${process.env.PASSWORD}@cluster0.vqnm6ti.mongodb.net/SIS-Sprint1`, { useNewUrlParser: true });

const saltRounds = 10;

const degreeSchema = new mongoose.Schema({
    name: String
})

const branchSchema = new mongoose.Schema({
    name: String
})

const courseSchema = new mongoose.Schema({
    name: String,
    code: String,
    credits: Number,
    description: String
});

const programSchema = new mongoose.Schema({
    degreeOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'Degree' },
    branchOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    coursesOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
})

const semesterSchema = new mongoose.Schema({
    name: String,
    dateCreated: Date,
    programsOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }]
})

const studentSchema = new mongoose.Schema({
    firstname: String,
    middlename: String,
    lastname: String,
    studentID: String,
    mobileNO: String,
    email: String,
    myemail: String,
    password: String,
    dob: Date,
    gender: String,
    parentEmail: String,
    programRegistered: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' }
});

const adminSchema = new mongoose.Schema({
    email: String,
    password: String
});

const instructorSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    myemail: String,
    mobileNO: String,
    dob: Date,
    gender: String,
    password: String
})

const courseAssignmentSchema = new mongoose.Schema({
    programAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    courseAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    instructorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
    semesterAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' }
})

const courseEnrollmentSchema = new mongoose.Schema({
    courseEnrolled: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    studentEnrolled: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    semesterEnrolled: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    grade: Number,
    attendance: Number
})

const feeStatusSchema = new mongoose.Schema({
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    studentEnrolled: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    status: Boolean
})


const Branch = mongoose.model("Branch", branchSchema);
const Degree = mongoose.model("Degree", degreeSchema);
const Course = mongoose.model("Course", courseSchema);
const Program = mongoose.model("Program", programSchema);
const Semester = mongoose.model("Semester", semesterSchema);


const Admin = mongoose.model("Admin", adminSchema);
const Student = mongoose.model("Student", studentSchema);
const Instructor = mongoose.model("Instructor", instructorSchema);

const CourseAssignment = mongoose.model("CourseAssignment", courseAssignmentSchema);
const CourseEnrollment = mongoose.model("CourseEnrollment", courseEnrollmentSchema);

app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.get('/adminHome', checkAuthenticatedAdmin, (req, res) => {

    Admin.findOne({ '_id': req.user })
        .then((user) => {
            res.render('adminHome.ejs', { user });
        })

});

app.get('/viewCourse', checkAuthenticatedAdmin, (req, res) => {

    Course.find({})
        .then((course) => {
            res.render('viewCourse.ejs', { course });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewCourse', checkAuthenticatedAdmin, (req, res) => {
    if (req.body.delete) {
        Course.deleteOne({ _id: req.body.delete })
            .then(() => {
                Course.find({})
                    .then((course) => {
                        res.render('viewCourse.ejs', { course });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Course.findOne({ _id: req.body.edit })
            .then((course) => {
                res.render('updateCourse.ejs', { course });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.post('/updateCourse', checkAuthenticatedAdmin, (req, res) => {
    Course.updateOne({ _id: req.body.btn }, { name: req.body.name, credits: req.body.credits, code: req.body.code, description: req.body.description })
        .then(() => {
            Course.find({})
                .then((course) => {
                    res.render('viewCourse.ejs', { course });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.get('/viewDegree', checkAuthenticatedAdmin, (req, res) => {

    Degree.find({})
        .then((degree) => {
            res.render('viewDegree.ejs', { degree });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewDegree', checkAuthenticatedAdmin, (req, res) => {
    if (req.body.delete) {
        Degree.deleteOne({ _id: req.body.delete })
            .then(() => {
                Degree.find({})
                    .then((degree) => {
                        res.render('viewDegree.ejs', { degree });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Degree.findOne({ _id: req.body.edit })
            .then((degree) => {
                res.render('updateDegree.ejs', { degree });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.post('/updateDegree', checkAuthenticatedAdmin, (req, res) => {
    Degree.updateOne({ _id: req.body.btn }, { name: req.body.name })
        .then(() => {
            Degree.find({})
                .then((degree) => {
                    res.render('viewDegree.ejs', { degree });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})


app.get('/viewBranch', checkAuthenticatedAdmin, (req, res) => {

    Branch.find({})
        .then((branch) => {
            res.render('viewBranch.ejs', { branch });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewBranch', checkAuthenticatedAdmin, (req, res) => {
    if (req.body.delete) {
        Branch.deleteOne({ _id: req.body.delete })
            .then(() => {
                Branch.find({})
                    .then((branch) => {
                        res.render('viewBranch.ejs', { branch });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Branch.findOne({ _id: req.body.edit })
            .then((branch) => {
                res.render('updateBranch.ejs', { branch });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.post('/updateBranch', checkAuthenticatedAdmin, (req, res) => {
    Branch.updateOne({ _id: req.body.btn }, { name: req.body.name })
        .then(() => {
            Branch.find({})
                .then((branch) => {
                    res.render('viewBranch.ejs', { branch });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.get('/viewProgram', checkAuthenticatedAdmin, (req, res) => {

    Program.find({})
        .populate(['degreeOffered', 'branchOffered', 'coursesOffered'])
        .exec()
        .then((program) => {
            res.render('viewProgram.ejs', { program });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post('/viewProgram', checkAuthenticatedAdmin, (req, res) => {
    if (req.body.delete) {
        Program.deleteOne({ '_id': req.body.delete })
            .then(() => {
                Program.find({})
                    .then((program) => {
                        res.render('viewProgram.ejs', { program });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Program.findOne({ '_id': req.body.edit })
            .then((program) => {
                res.render('updateProgram.ejs', { program });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.get('/viewSemester', checkAuthenticatedAdmin, (req, res) => {

    Semester.find({})
        .sort({ dateCreated: -1 })
        .then((semester) => {
            res.render('viewSemester.ejs', { semester });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewSemester', checkAuthenticatedAdmin, (req, res) => {
    if (req.body.delete) {

        Semester.findOne({ '_id': req.body.delete })
            .then((semester) => {
                CourseAssignment.deleteMany({ semesterAssigned: semester })
                    .then(() => {
                        Semester.deleteOne({ '_id': req.body.delete })
                            .then(() => {
                                res.render('viewSemester.ejs', { semester });
                            })
                            .catch((err) => {
                                console.error(err);
                            });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {


    }
})


app.get('/addCourse', checkAuthenticatedAdmin, (req, res) => {
    res.render('addCourse.ejs');
});

app.post('/addCourse', checkAuthenticatedAdmin, (req, res) => {

    const newCourse = new Course({
        name: req.body.name,
        code: req.body.code,
        credits: req.body.credits,
        description: req.body.description
    });

    newCourse.save();
    res.redirect('/viewCourse');
});

app.get('/addDegree', checkAuthenticatedAdmin, (req, res) => {
    res.render('addDegree.ejs');
});

app.post('/addDegree', checkAuthenticatedAdmin, (req, res) => {

    const newDegree = new Degree({
        name: req.body.name
    });

    newDegree.save();
    res.redirect('/viewDegree');
});

app.get('/addBranch', checkAuthenticatedAdmin, (req, res) => {
    res.render('addBranch.ejs');
});

app.post('/addBranch', checkAuthenticatedAdmin, (req, res) => {

    const newBranch = new Branch({
        name: req.body.name
    });

    newBranch.save();
    res.redirect('/viewBranch');
});

app.get('/addProgram', checkAuthenticatedAdmin, (req, res) => {
    Degree.find({})
        .then((degree) => {
            Branch.find({})
                .then((branch) => {
                    Course.find({})
                        .then((course) => {
                            res.render('addProgram.ejs', { degree, branch, course });
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.post('/addProgram', checkAuthenticatedAdmin, (req, res) => {

    Degree.findById(req.body.degree)
        .then((degree) => {
            Branch.findById(req.body.branch)
                .then((branch) => {

                    Course.find({ '_id': { $in: req.body.course } })
                        .then((course) => {
                            const newProgram = new Program({
                                degreeOffered: degree,
                                branchOffered: branch,
                                coursesOffered: course
                            });

                            newProgram.save();
                            console.log(newProgram);
                            res.redirect('/viewProgram');
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.get('/addSemester', checkAuthenticatedAdmin, (req, res) => {

    Program.find({})
        .populate(['degreeOffered', 'branchOffered', 'coursesOffered'])
        .exec()
        .then((program) => {
            res.render('addSemester.ejs', { program });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post('/addSemester', checkAuthenticatedAdmin, (req, res) => {

    const newSemester = new Semester({
        name: req.body.name,
        dateCreated: new Date(),
        programsOffered: req.body.program

    });

    newSemester.save()
        .then(savedSemester => {
            return Semester.populate(savedSemester, {
                path: 'programsOffered',
                populate: [
                    { path: 'degreeOffered', model: Degree },
                    { path: 'branchOffered', model: Branch },
                    { path: 'coursesOffered', model: Course }
                ]
            });
        })
        .then(populatedSemester => {

            Instructor.find({})
                .then((instructor) => {
                    res.render('assignCourse.ejs', { populatedSemester, instructor });
                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });

})

app.post('/assignCourse', checkAuthenticatedAdmin, (req, res) => {

    for (var i = 0; i < req.body.courseAssigned.length; i++) {

        const tuple = req.body.courseAssigned[i].split(" ");

        Semester.findById(tuple[0])
            .then((semester) => {
                Program.findById(tuple[1])
                    .then((program) => {
                        Course.findById(tuple[2])
                            .then((course) => {
                                Instructor.findById(tuple[3])
                                    .then((instructor) => {
                                        const newCourseAssignment = new CourseAssignment({
                                            semesterAssigned: semester,
                                            programAssigned: program,
                                            courseAssigned: course,
                                            instructorAssigned: instructor
                                        });

                                        newCourseAssignment.save();
                                        // res.redirect('/generate-pdf');
                                    })
                                    .catch(err => {
                                        console.error(err);
                                    });
                            })
                            .catch(err => {
                                console.error(err);
                            });
                    })
                    .catch(err => {
                        console.error(err);
                    });
            })
            .catch(err => {
                console.error(err);
            });
    }
    res.redirect('/generate-pdf');
})

app.get('/generate-pdf', checkAuthenticatedAdmin, (req, res) => {

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream('example.pdf');
    doc.pipe(res);

    Semester.find()
        .sort({ dateCreated: -1 })
        .limit(1)
        .populate({
            path: 'programsOffered',
            populate: [
                { path: 'degreeOffered', model: Degree },
                { path: 'branchOffered', model: Branch },
                { path: 'coursesOffered', model: Course }
            ]
        })
        .exec()
        .then((semester) => {
            CourseAssignment.find({ semesterAssigned: semester })
                .populate([
                    {
                        path: 'programAssigned',
                        populate: [
                            { path: 'degreeOffered', model: Degree },
                            { path: 'branchOffered', model: Branch }
                        ]
                    },
                    {
                        path: 'instructorAssigned'
                    },
                    {
                        path: 'courseAssigned'
                    },
                    {
                        path: 'semesterAssigned'
                    }
                ])
                .exec()
                .then((semesterAssignments) => {

                    doc.fontSize(20)
                        .text(semester[0].name, { align: 'center' })
                        .moveDown();

                    for (var i = 0; i < semesterAssignments.length; i++) {
                        doc.fontSize(10)
                            .text(`${semesterAssignments[i].programAssigned.degreeOffered.name} ${semesterAssignments[i].programAssigned.branchOffered.name} - ${semesterAssignments[i].courseAssigned.name} : ${semesterAssignments[i].instructorAssigned.fullname}`, { align: 'center' })
                            .moveDown();
                    }

                    doc.end();

                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });
        // doc.end();

    // fetch data from the database

    // doc.fontSize(20)
    //     .text('My Complex PDF Document', { align: 'center' })
    //     .moveDown();

    // doc.fontSize(16)
    //     .text('Table of Contents', { underline: true })
    //     .moveDown();

    // doc.list([
    //     { text: 'Introduction', link: '#introduction' },
    //     { text: 'Chapter 1 - Getting Started', link: '#chapter1' },
    //     { text: 'Chapter 2 - Advanced Topics', link: '#chapter2' },
    // ]);

    // doc.addPage();
    // doc.fontSize(24)
    //     .text('Introduction', { id: 'introduction', underline: true })
    //     .moveDown();

    // doc.fontSize(16)
    //     .text('Welcome to my complex PDF document!')
    //     .moveDown();

    // doc.fontSize(24)
    //     .text('Chapter 1 - Getting Started', { id: 'chapter1', underline: true })
    //     .moveDown();

    // doc.fontSize(16)
    //     .text('This chapter will cover the basics of getting started with my complex PDF document.')
    //     .moveDown();

    // doc.fontSize(24)
    //     .text('Chapter 2 - Advanced Topics', { id: 'chapter2', underline: true })
    //     .moveDown();

    // doc.fontSize(16)
    //     .text('This chapter will cover some more advanced topics related to my complex PDF document.');


});

app.get('/addStudent', checkAuthenticatedAdmin, (req, res) => {
    res.render('addStudent.ejs');
})

app.post('/addStudent', checkAuthenticatedAdmin, (req, res) => {

    function generateP() {
        var pass = '';
        var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
            'abcdefghijklmnopqrstuvwxyz0123456789@#$';

        for (let i = 1; i <= 10; i++) {
            var char = Math.floor(Math.random()
                * str.length + 1);

            pass += str.charAt(char)
        }

        return pass;
    }

    Student.findOne({ email: req.body.email })
        .then((student) => {

            if (student != null) {
                res.redirect('/adminHome');
            }

            else {
                const randomPass = generateP();
                bcrypt.hash(randomPass, saltRounds)
                    .then((hashedPassword) => {

                        const newStudent = new Student({
                            email: req.body.email,
                            password: hashedPassword
                        });

                        newStudent.save();

                        var transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 465,
                            secure: true,
                            auth: {
                                user: 'devarshnagrecha58@gmail.com',
                                pass: process.env.GMAILPASSWORD
                            }
                        });

                        var mailOptions = {
                            from: 'devarshnagrecha58@gmail.com',
                            to: req.body.email,
                            subject: 'Student Information System',
                            text: `Your account has been created! Your password is ${randomPass}`
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log(req.user + "\n" + req.body.email);
                                console.log('Email sent: ' + info.response);
                            }
                        });

                        res.redirect('/addStudent');

                    })
                    .catch(err => {
                        console.log('Error:', err);
                    })
            }
        })
        .catch(err => {
            console.log('Error:', err);
        })
})

app.get('/addInstructor', checkAuthenticatedAdmin, (req, res) => {
    res.render('addInstructor.ejs');
})

app.post('/addInstructor', checkAuthenticatedAdmin, (req, res) => {

    function generateP() {
        var pass = '';
        var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
            'abcdefghijklmnopqrstuvwxyz0123456789@#$';

        for (let i = 1; i <= 10; i++) {
            var char = Math.floor(Math.random()
                * str.length + 1);

            pass += str.charAt(char)
        }

        return pass;
    }

    Instructor.findOne({ email: req.body.email })
        .then((instructor) => {

            if (instructor != null) {
                res.redirect('/adminHome');
            }

            else {
                const randomPass = generateP();
                bcrypt.hash(randomPass, saltRounds)
                    .then((hashedPassword) => {

                        const newInstructor = new Instructor({
                            email: req.body.email,
                            fullname: req.body.fullname,
                            password: hashedPassword
                        });

                        newInstructor.save();

                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'devarshnagrecha58@gmail.com',
                                pass: process.env.GMAILPASSWORD
                            }
                        });

                        var mailOptions = {
                            from: 'devarshnagrecha58@gmail.com',
                            to: req.body.email,
                            subject: 'Student Information System',
                            text: `Your account has been created! Your password is ${randomPass}`
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });

                        res.redirect('/addInstructor');

                    })
                    .catch(err => {
                        console.log('Error:', err);
                    })
            }
        })
        .catch(err => {
            console.log('Error:', err);
        })
})

app.get('/addAdmin', (req, res) => {
    res.render('addAdmin.ejs');
})

app.post('/addAdmin', checkAuthenticatedAdmin, (req, res) => {

    Admin.findOne({ email: req.body.email })
        .then((admin) => {

            if (admin != null) {
                res.redirect('/adminHome');
            }

            else {
                bcrypt.hash(req.body.password, saltRounds)
                    .then((hashedPassword) => {

                        const newAdmin = new Admin({
                            email: req.body.email,
                            password: hashedPassword
                        });

                        newAdmin.save();

                        res.redirect('/addAdmin');

                    })
                    .catch(err => {
                        console.log('Error:', err);
                    })
            }
        })
        .catch(err => {
            console.log('Error:', err);
        })
})

app.get('/studentLogin', checkNotAuthenticatedStudent, (req, res) => {
    res.render('studentLogin.ejs')
})

app.post('/studentLogin', passportStudent.authenticate('student', {
    successRedirect: '/studentHome',
    failureRedirect: '/studentLogin',
    failureFlash: true
}))

app.get('/studentHome', checkAuthenticatedStudent, (req, res) => {

    Student.findOne({ '_id': req.user })
        .then((student) => {
            if (student.firstname == null) {
                // Student logging for the first time
                Program.find({})
                    .populate(['degreeOffered', 'branchOffered', 'coursesOffered'])
                    .exec()
                    .then((program) => {
                        console.log(student + " " + req.user);
                        res.render('studentDetails.ejs', { program, student });
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }

            else {
                Student.findOne({ '_id': req.user })
                    .then((student) => {
                        res.render('studentHome.ejs', { student });
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        })
        .catch((err) => {
            console.log(err);
        });
})

app.post('/studentDetails', checkAuthenticatedStudent, (req, res) => {

    if (req.body.password != req.body.repassword) {
        // passwords do not match
        res.redirect('/studentDetails');
    }

    else {
        bcrypt.hash(req.body.password, saltRounds)
            .then((hashedPassword) => {
                Student.updateOne({ '_id': req.user }, { firstname: req.body.firstname, middlename: req.body.middlename, lastname: req.body.lastname, studentID: req.body.sid, programRegistered: req.body.myProgram, dob: req.body.dob, myemail: req.body.myemail, parentEmail: req.body.parentEmail, gender: req.body.gender, mobileNO: req.body.mobileNO, password: hashedPassword })
                    .then(() => {

                        Student.findOne({ '_id': req.user })
                            .then((student) => {
                                res.render('studentHome.ejs', { student });
                            })
                            .catch((err) => {
                                console.log(err);
                            });

                    })
                    .catch((err) => {
                        console.log(err);
                    });
            })
            .catch((err) => {
                console.log(err);
            });
    }

})

app.get('/instructorLogin', checkNotAuthenticatedInstructor, (req, res) => {
    res.render('instructorLogin.ejs')
})

app.post('/instructorLogin', passportInstructor.authenticate('instructor', {
    successRedirect: '/instructorHome',
    failureRedirect: '/instructorLogin',
    failureFlash: true
}))

app.get('/instructorHome', checkAuthenticatedInstructor, (req, res) => {

    Instructor.findOne({ '_id': req.user })
        .then((instructor) => {
            if (instructor.dob == null) {
                console.log(instructor);
                res.render('instructorDetails.ejs', { instructor });
            }

            else {
                res.render('instructorHome.ejs', { instructor });

            }
        })
        .catch((err) => {
            console.log(err);
        });

})

app.post('/instructorDetails', checkAuthenticatedInstructor, (req, res) => {

    if (req.body.password != req.body.repassword) {
        // passwords do not match
        res.redirect('/instructorDetails');
    }

    else {
        bcrypt.hash(req.body.password, saltRounds)
            .then((hashedPassword) => {
                Instructor.updateOne({ '_id': req.user }, { dob: req.body.dob, myemail: req.body.myemail, gender: req.body.gender, mobileNO: req.body.mobileNO, password: hashedPassword })
                    .then(() => {

                        Instructor.findOne({ '_id': req.user })
                            .then((instructor) => {
                                res.render('instructorHome.ejs', { instructor });
                            })
                            .catch((err) => {
                                console.log(err);
                            });

                    })
                    .catch((err) => {
                        console.log(err);
                    });
            })
            .catch((err) => {
                console.log(err);
            });
    }

})

app.get('/adminLogin', checkNotAuthenticatedAdmin, (req, res) => {
    res.render('adminLogin.ejs')
})

app.post('/adminLogin', passportInstructor.authenticate('admin', {
    successRedirect: '/adminHome',
    failureRedirect: '/adminLogin',
    failureFlash: true
}))

app.get('/adminHome', checkAuthenticatedAdmin, (req, res) => {

    Admin.findOne({ '_id': req.user })
        .then((admin) => {
            res.render('adminHome.ejs', { admin });
        })
        .catch((err) => {
            console.log(err);
        });

})

app.get('/semesterRegistration', checkAuthenticatedStudent, (req, res) => {

    Semester.find()
        .sort({ dateCreated: -1 })
        .limit(1)
        .populate({
            path: 'programsOffered',
            populate: [
                { path: 'degreeOffered', model: Degree },
                { path: 'branchOffered', model: Branch },
                { path: 'coursesOffered', model: Course }
            ]
        })
        .exec()
        .then((semester) => {
            Student.findOne({ '_id': req.user })
                .populate('programRegistered')
                .exec()
                .then((student) => {
                    CourseEnrollment.find({ studentEnrolled: student, semesterEnrolled: semester })
                        .then((courseEnrollments) => {
                            if (courseEnrollments.length != 0) {
                                res.redirect('/studentHome');
                            }

                            else {
                                CourseAssignment.find({ semesterAssigned: semester, programAssigned: student.programRegistered })
                                    .populate([
                                        {
                                            path: 'programAssigned',
                                            populate: [
                                                { path: 'degreeOffered', model: Degree },
                                                { path: 'branchOffered', model: Branch }
                                            ]
                                        },
                                        {
                                            path: 'instructorAssigned'
                                        },
                                        {
                                            path: 'courseAssigned'
                                        },
                                        {
                                            path: 'semesterAssigned'
                                        }
                                    ])
                                    .exec()
                                    .then((semesterAssignments) => {

                                        //console.log(semesterAssignments);
                                        res.render('semesterRegistration.ejs', { semesterAssignments })
                                    })
                                    .catch(err => {
                                        console.error(err);
                                    });
                            }
                        })
                        .catch(err => {
                            console.error(err);
                        });
                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });
})

app.post('/semesterRegistration', checkAuthenticatedStudent, (req, res) => {

    if (req.body.register.length > 6) {
        res.redirect('/semesterRegistration');
    }

    else {

        //console.log(req.body.register);
        for (var i = 0; i < 6; i++) {

            const x = req.body.register[i]
            Student.findById(req.user)
                .then((student) => {
                    Course.findById(x)
                        .then((course) => {
                            Semester.findById(req.body.sem)
                                .then((semester) => {

                                    const newCourseEnrollment = new CourseEnrollment({
                                        semesterEnrolled: semester,
                                        studentEnrolled: student,
                                        courseEnrolled: course
                                    })
                                    //console.log(newCourseEnrollment);
                                    newCourseEnrollment.save();
                                })
                                .catch(err => {
                                    console.error(err);
                                });
                        })
                        .catch(err => {
                            console.error(err);
                        });
                })
                .catch(err => {
                    console.error(err);
                });
        }
        res.redirect('/studentHome');
    }
})

app.get('/semesterResults', checkAuthenticatedStudent, (req, res) => {

    CourseEnrollment.find({ 'studentEnrolled': req.user })
        .distinct('semesterEnrolled')
        .then((enrollment) => {
            Semester.find()
                .where('_id')
                .in(enrollment)
                .sort({ dateCreated: 1 })
                .then((semester) => {
                    res.render('semesterResults.ejs', { semester })
                    //console.log(semester);
                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });

})

app.post('/semesterResults', checkAuthenticatedStudent, (req, res) => {
    const tuple = req.body.x.split(" ");
    //console.log(tuple);
    CourseEnrollment.find({ 'studentEnrolled': req.user, 'semesterEnrolled': tuple[0] })
        .populate(['courseEnrolled', 'semesterEnrolled', 'studentEnrolled'])
        .exec()
        .then((result) => {
            res.render('gradeCard.ejs', { result, tuple })
        })
        .catch(err => {
            console.error(err);
        });
})

app.post('/gradeCard', checkAuthenticatedStudent, (req, res) => {

    //console.log(req.body);
    const tuple = req.body.result.split(" ");
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream('result.pdf');
    doc.pipe(res);


    CourseEnrollment.find({ 'studentEnrolled': tuple[1], 'semesterEnrolled': tuple[0] })
        .populate(['studentEnrolled', 'semesterEnrolled', 'courseEnrolled'])
        .exec()
        .then((grades) => {

            doc.fontSize(15)
                .text(`Student ID : ${grades[0].studentEnrolled.studentID}`, { align: 'center' })
                .moveDown()
                .text(`Full name : ${grades[0].studentEnrolled.firstname} ${grades[0].studentEnrolled.middlename} ${grades[0].studentEnrolled.lastname}`, { align: 'center' })
                .moveDown()
                .text(`Semester number: ${tuple[2]}`, { align: 'center' })
                .moveDown()
                .text(`Semester name: ${grades[0].semesterEnrolled.name}`, { align: 'center' })
                .moveDown()

            var spi = 0;
            for (var i = 0; i < grades.length; i++) {
                spi += grades[i].grade;
                doc.fontSize(10)
                    .text(`${i + 1} - ${grades[i].courseEnrolled.code} - ${grades[i].courseEnrolled.name} - ${grades[i].courseEnrolled.credits} - ${grades[i].grade}`, { align: 'center' })
                    .moveDown();
            }
            spi /= 6;
            spi = Math.round(spi * 100) / 100;
            doc.fontSize(10)
                .text(`SPI : ${spi}`, { align: 'center' })

            doc.end();


        })
        .catch(err => {
            console.error(err);
        });

})

app.get('/viewStudent', checkAuthenticatedStudent, (req, res) => {
    Student.findOne({ '_id': req.user })
        .populate([
            {
                path: 'programRegistered',
                populate: [
                    { path: 'degreeOffered', model: Degree },
                    { path: 'branchOffered', model: Branch }
                ]
            }
        ])
        .exec()
        .then((student) => {

            CourseEnrollment.find({'studentEnrolled':req.user})
                .distinct('semesterEnrolled')
                .then((curr_sem) => {

                    var x = curr_sem.length;
                    res.render('viewStudent.ejs', { student, x });
                })
            
        })
})

app.get('/updateStudent', checkAuthenticatedStudent, (req, res) => {
    Student.findOne({ '_id': req.user })
        .then((student) => {
            res.render('updateStudent.ejs', { student }); 
        })
})

app.post('/updateStudent', checkAuthenticatedStudent, (req, res) => {
    Student.updateOne({ '_id': req.user }, {firstname: req.body.firstname, middlename: req.body.middlename, lastname: req.body.lastname, mobileNO: req.body.mobileNO, myemail: req.body.myemail, parentEmail: req.body.parentEmail, dob:req.body.dob, gender: req.body.gender})
        .then((student) => {
            res.redirect('/studentHome');
        })
})

app.get('/instructorSemester', checkAuthenticatedInstructor, (req, res) => {

    CourseAssignment.find({ 'instructorAssigned': req.user })
        .distinct('semesterAssigned')
        .then((assignment) => {
            Semester.find()
                .where('_id')
                .in(assignment)
                .sort({ dateCreated: -1 })
                .then((semester) => {
                    res.render('instructorSemester.ejs', { semester })
                    //console.log(semester);
                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });
})

app.post('/instructorSemester', checkAuthenticatedInstructor, (req, res) => {

    CourseAssignment.find({ 'instructorAssigned': req.user, 'semesterAssigned': req.body.x })
        .populate([
            {
                path: 'programAssigned',
                populate: [
                    { path: 'degreeOffered', model: Degree },
                    { path: 'branchOffered', model: Branch }
                ]
            },
            {
                path: 'courseAssigned'
            },
            {
                path: 'semesterAssigned'
            }
        ])
        .exec()
        .then((courseAssignment) => {
            res.render('gradeSemester.ejs', { courseAssignment })
        })
        .catch(err => {
            console.error(err);
        });

    // CourseAssignment.aggregate([
    //     { $match: { instructorAssigned: req.user, semesterAssigned: req.body.x } },
    //     { $group: { _id: '$programAssigned', count: { $sum: 1 } } },
    //     { $lookup: { from: 'courses', localField: '_id', foreignField: 'courseAssigned', as: 'courses', 
    //                 from: 'semesters', localField: '_id', foreignField: 'semesterAssigned', as: 'semesters',
    //                 from: 'programs', localField: '_id', foreignField: 'programAssigned', as: 'programs'
    //     } },
    //     { $lookup: { from: 'degrees', localField: 'programs._id', foreignField: 'program', as: 'programs.degrees', from: 'branches', localField: 'programs._id', foreignField: 'program', as: 'programs.branches' } }
    // ])
    // .then((ans) => {
    //     console.log(ans);
    // })
})

app.post('/gradeAssign', checkAuthenticatedInstructor, (req, res) => {

    //console.log(req.body.x);
    const tuple = req.body.x.split(" ");
    Student.find({ 'programRegistered': tuple[2] })
        .then((students) => {
            CourseEnrollment.find({ 'semesterEnrolled': tuple[0], 'courseEnrolled': tuple[1], 'studentEnrolled': { $in: students } })
                .populate(['courseEnrolled', 'studentEnrolled', 'semesterEnrolled'])
                .exec()
                .then((gradeStudents) => {

                    //console.log(gradeStudents);
                    res.render('addGrade.ejs', { gradeStudents });
                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });
})

app.post('/addGrade', (req, res) => {

    console.log(req.body);
    for (var i = 0; i < req.body.grades.length; i++) {
        CourseEnrollment.findOneAndUpdate({ 'courseEnrolled': req.body.course, 'semesterEnrolled': req.body.semester, 'studentEnrolled': req.body.student[i] }, { grade: req.body.grades[i] }, { new: true })
            .populate(['courseEnrolled', 'studentEnrolled', 'semesterEnrolled'])
            .exec()
            .then((ans) => {

                var transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'devarshnagrecha58@gmail.com',
                        pass: process.env.GMAILPASSWORD
                    }
                });


                var mailOptions = {
                    from: 'devarshnagrecha58@gmail.com',
                    to: ans.studentEnrolled.email,
                    subject: 'Student Information System',
                    text: `${ans.semesterEnrolled.name} semester grades updated for the course ${ans.courseEnrolled.name}. Recieved grade: ${ans.grade}`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(req.user + "\n" + req.body.email);
                        console.log('Email sent: ' + info.response);
                    }
                });

                res.redirect('/instructorHome');
            })
            .catch((err) => {
                console.error(err);
            });

    }

})
app.delete('/logoutStudent', (req, res) => {
    req.logOut(req.user, err => {
        if (err) return next(err);
        res.redirect('/studentLogin');
    })
})

app.delete('/logoutInstructor', (req, res) => {
    req.logOut(req.user, err => {
        if (err) return next(err);
        res.redirect('/instructorLogin');
    })
})

app.delete('/logoutAdmin', (req, res) => {
    req.logOut(req.user, err => {
        if (err) return next(err);
        res.redirect('/adminLogin');
    })
})

function checkAuthenticatedStudent(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/studentLogin')
}

function checkNotAuthenticatedStudent(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/studentHome')
    }
    next()
}

function checkAuthenticatedInstructor(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/instructorLogin')
}

function checkNotAuthenticatedInstructor(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/instructorHome')
    }
    next()
}

function checkAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/adminLogin')
}

function checkNotAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/adminHome')
    }
    next()
}

app.listen(3000, function () {
    console.log("Server started on port 3000");
});