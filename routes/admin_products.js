var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resieImg = require('resize-img');

// Get Product model
var Product = require('../models/product');

// Get Category model
var Category = require('../models/category');

/*
* GET products index
*/

router.get('/', function(req, res){
  var count;

  Product.count(function(err, c){
    count = c;
  })

  Product.find(function(err, products){
    res.render('admin/products', {
      products: products,
      count: count
    })
  })
});

/*
* GET add product
*/

router.get('/add-product', function(req, res){
  var title = "";
  var desc = "";
  var price = "";

  Category.find(function(err, categories){
    res.render('admin/add_product', {
      title: title,
      desc: desc,
      categories: categories,
      price: price
    });
  });
});

/*
* POST add product
*/

router.post('/add-product', function(req, res){
  req.checkBody('title', 'Title must have a value.').notEmpty();
  req.checkBody('desc', 'Description must have a value.').notEmpty();
  req.checkBody('price', 'Price must have a value.').isDecimal();

  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if (slug === "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;

  var errors = req.validationErrors();

  if (errors) {
    console.log('errors');
    res.render('admin/add_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content
    });
  }else {
    Page.findOne({ slug: slug }, function (err, page){
      if (page){
        req.flash('danger', 'Page slug exists, choose another.');
        res.render('admin/add_page', {
          errors: errors,
          title: title,
          slug: slug,
          content: content
        });
      } else {
        var page = new Page({
          title: title,
          slug: slug,
          content: content,
          sorting: 100
        });

        page.save(function(err){
          if (err) return console.log(err);

          req.flash('success', 'Page Added!');
          res.redirect('/admin/pages');

        });
      }
    })
  }

});

/*
* POST reorder pages
*/

router.post('/reorder-pages', function(req, res){
  var ids = req.body['id[]'];

  var count = 0;

  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    count++;

    (function(count){
      Page.findById(id, function(err, page){
        page.sorting = count;
        page.save(function (err){
          if( err)
            return console.log(err);
        });
      });
    })(count);
  };
});

/*
* GET edit page
*/

router.get('/edit-page/:id', function(req, res){
  Page.findById(req.params.id, function(err, page){
    if (err)
      return console.log(err);

    res.render('admin/edit_page', {
      title: page.title,
      slug: page.slug,
      content: page.content,
      id: page._id
    });
  });
});


/*
* POST edit page
*/

router.post('/edit-page/:id', function(req, res){
  req.checkBody('title', 'Title must have a value.').notEmpty();
  req.checkBody('content', 'Content must have a value.').notEmpty();

  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if (slug === "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  var id = req.params.id;

  var errors = req.validationErrors();

  if (errors) {
    console.log('errors');
    res.render('admin/edit_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content,
      id: id
    });
  }else {
    Page.findOne({ slug: slug, _id:{ '$ne':id } }, function (err, page){
      if (page){
        req.flash('danger', 'Page slug exists, choose another.');
        res.render('admin/edit_page', {
          errors: errors,
          title: title,
          slug: slug,
          content: content,
          id: id
        });
      } else {
        
        Page.findById(id, function(err, page){
          if (err) return console.log(err);
          page.title = title;
          page.slug = slug;
          page.content = content;

            page.save(function(err){
              if (err) return console.log(err);

              req.flash('success', 'Page edited!');
              res.redirect('/admin/pages/edit-page/' + id);

            });
        });
      }
    })
  }

});

/*
* GET delete page
*/

router.get('/delete-page/:id', function(req, res){
  Page.findByIdAndRemove(req.params.id, function(err){
    if (err) return console.log;

    req.flash('success', 'Page deleted!');
    res.redirect('/admin/pages');

  })
});



// Exports
module.exports = router