'use strict';
const Sequelize = require("sequelize");

//Book model format and validation

module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define('Book', {
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Title is required"
        }
      }
    },
    author: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Author is required"
        }
      }
    },
    genre: DataTypes.STRING,
    year: DataTypes.INTEGER
  }, {});
  Book.associate = function(models) {
    // associations can be defined here
  };

 
//Gets and returns the number of pages required based on the query and records per page
  Book.getNumPages = async function(query, perPage) {
    try {
      const Op = Sequelize.Op;
      const totalRecords = await this.count({
        where: {
          [Op.or]: [
            { title: { [Op.substring]: query } },
            { genre: { [Op.substring]: query } },
            { year: { [Op.substring]: query } },
            { author: { [Op.substring]: query } }
          ]
        },
        order: [["title", "ASC"]]
      });

      return Math.ceil(totalRecords / perPage);
    } catch (err) {
      throw new Error("Error getting pages");
    }
  };

//Finds and returns all results based on the search, book listings per page, and the amount of pages 
  Book.findByQueryAndPagination = async function(
    query,
    booksPerPage,
    currentPage
  ) {
    try {
      const Op = Sequelize.Op;
      return await this.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.substring]: query } },
            { genre: { [Op.substring]: query } },
            { year: { [Op.substring]: query } },
            { author: { [Op.substring]: query } }
          ]
        },
        order: [["title", "ASC"]],
        limit: booksPerPage,
        offset: (currentPage - 1) * booksPerPage
      });
    } catch (err) {
      throw err;
    }
  };

  return Book;
};