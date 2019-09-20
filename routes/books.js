var express = require('express');
var router = express.Router();
var Book = require('../models').Book;
var Sequelize = require('sequelize');
var Op = Sequelize.Op;
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'library.db'
});

//GET books listing
//pagination, search, page number max
router.get("/", async (req, res, next) => {
  try {
    const booksPerPage = 10;
    const query = req.query.query ? req.query.query : "";
    const numPages = await Book.getNumPages(query, booksPerPage);
    const activePage = req.query.page ? parseInt(req.query.page): (numPages === 0 ? 0: 1);
    if (activePage > numPages || activePage < 0) {
      return next();
    }
    const books = await Book.findByQueryAndPagination(
      query,
      booksPerPage,
      activePage
    );
    res.locals.books = books;
    res.locals.title = "Jasmine's Book Library";
    res.locals.pages = numPages;
    res.locals.query = query;
    res.locals.activePage = activePage;
    res.render("index");
  } catch (err) {
    return next(err);
  }
});

//GET search
router.get('/search', (req, res) => {
  let query = req.query.search.toLowerCase();
  Book.findAll({
      where: {
          [Op.or]: [
              sequelize.where(
                  sequelize.fn('lower', sequelize.col('title')),
                  { [Op.like]: '%' + query + '%' },
              ),
              sequelize.where(
                  sequelize.fn('lower', sequelize.col('author')),
                  { [Op.like]: '%' + query + '%' },
              ),
              sequelize.where(
                  sequelize.fn('lower', sequelize.col('genre')),
                  { [Op.like]: '%' + query + '%' },
              ),
              sequelize.where(
                  sequelize.fn('lower', sequelize.col('year')),
                  { [Op.like]: '%' + query + '%' },
              )
          ]
      }
  }).then(books => res.render('index', { books }));
});

//GET new books and show the create new book 
router.get('/new', (req, res) =>
    res.render('new-book', { book: Book.build(), pageTitle: "New Book" })
);

//Posts a new book to the database
router.post('/new', (req, res, next) => {
    Book.create(req.body).then(function (book) {
        let { title, author, genre, year } = req.body;
        // redirects to home page after creating book
        res.redirect('/')      
    })
        .catch(err => {
            if (err.name === "SequelizeValidationError") {
                res.render('new-book', {
                    book: Book.build(req.body),
                    pageTitle: "New Book",
                    errors: err.errors
                })
            } else {
                throw error;
            }
        }).catch(function (error) {
            res.send(500, error);
        });
});

//GET individual book 
router.get('/:id', function(req, res, next) {
  Book.findByPk(req.params.id).then(function(book){
    if(book) {
      res.render('update-book', {book: book, title: book.title, id: req.params.id});
    } else {
      res.render('page-not-found');
    }
  }).catch(function(err) {
    res.send(500);
  });
});

//POST updated book 
router.post('/:id', function(req, res, next) {
  Book.findByPk(req.params.id).then(function(book){
    if(book) {
      return book.update(req.body);
    } else {
      res.render('page-not-found');
    }
  }).then(function() {
    res.redirect('/');
  }).catch(function(err){
    if(err.name === "SequelizeValidationError") {
      var book = Book.build(req.body);
      book.id = req.params.id;

      res.render('update-book', {
        book: book,
        title: "Update title",
        errors: err.errors
      });
    } else {
      throw err;
    }
  }).catch(function(err) {
    res.send(500);
  });;
});

//POST deleted book 
router.post('/:id/delete', function(req, res, next) {
  Book.findByPk(req.params.id).then(function(book){
    if(book) {
      return book.destroy();
    } else {
      res.render('page-not-found');
    }
  }).then(function() {
    res.redirect('/');
  }).catch(function(err) {
    res.send(500);
  });;
});



//export router
module.exports = router;    