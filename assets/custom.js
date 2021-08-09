/**
 * Include your custom JavaScript here.
 *
 * We also offer some hooks so you can plug your own logic. For instance, if you want to be notified when the variant
 * changes on product page, you can attach a listener to the document:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   var variant = event.detail.variant; // Gives you access to the whole variant details
 * });
 *
 * You can also add a listener whenever a product is added to the cart:
 *
 * document.addEventListener('product:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 *   var quantity = event.detail.quantity; // Get the quantity that was added
 * });
 */


// Sticky Plugin v1.0.4 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 02/14/2011
// Date: 07/20/2015
// Website: http://stickyjs.com/
// Description: Makes an element on the page stick on the screen as you scroll
//              It will only set the 'top' and 'position' of your element, you
//              might need to adjust the width in some cases.

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  var slice = Array.prototype.slice; // save ref to original slice()
  var splice = Array.prototype.splice; // save ref to original slice()

  var defaults = {
    topSpacing: 0,
    bottomSpacing: 0,
    className: 'is-sticky',
    wrapperClassName: 'sticky-wrapper',
    center: false,
    getWidthFrom: '',
    widthFromWrapper: true, // works only when .getWidthFrom is empty
    responsiveWidth: false,
    zIndex: 'inherit'
  },
      $window = $(window),
      $document = $(document),
      sticked = [],
      windowHeight = $window.height(),
      scroller = function() {
        var scrollTop = $window.scrollTop(),
            documentHeight = $document.height(),
            dwh = documentHeight - windowHeight,
            extra = (scrollTop > dwh) ? dwh - scrollTop : 0;

        for (var i = 0, l = sticked.length; i < l; i++) {
          var s = sticked[i],
              elementTop = s.stickyWrapper.offset().top,
              etse = elementTop - s.topSpacing - extra;

          //update height in case of dynamic content
          s.stickyWrapper.css('height', s.stickyElement.outerHeight());

          if (scrollTop <= etse) {
            if (s.currentTop !== null) {
              s.stickyElement
              .css({
                'width': '',
                'position': '',
                'top': '',
                'z-index': ''
              });
              s.stickyElement.parent().removeClass(s.className);
              s.stickyElement.trigger('sticky-end', [s]);
              s.currentTop = null;
            }
          }
          else {
            var newTop = documentHeight - s.stickyElement.outerHeight()
            - s.topSpacing - s.bottomSpacing - scrollTop - extra;
            if (newTop < 0) {
              newTop = newTop + s.topSpacing;
            } else {
              newTop = s.topSpacing;
            }
            if (s.currentTop !== newTop) {
              var newWidth;
              if (s.getWidthFrom) {
                padding =  s.stickyElement.innerWidth() - s.stickyElement.width();
                newWidth = $(s.getWidthFrom).width() - padding || null;
              } else if (s.widthFromWrapper) {
                newWidth = s.stickyWrapper.width();
              }
              if (newWidth == null) {
                newWidth = s.stickyElement.width();
              }
              s.stickyElement
              .css('width', newWidth)
              .css('position', 'fixed')
              .css('top', newTop)
              .css('z-index', s.zIndex);

              s.stickyElement.parent().addClass(s.className);

              if (s.currentTop === null) {
                s.stickyElement.trigger('sticky-start', [s]);
              } else {
                // sticky is started but it have to be repositioned
                s.stickyElement.trigger('sticky-update', [s]);
              }

              if (s.currentTop === s.topSpacing && s.currentTop > newTop || s.currentTop === null && newTop < s.topSpacing) {
                // just reached bottom || just started to stick but bottom is already reached
                s.stickyElement.trigger('sticky-bottom-reached', [s]);
              } else if(s.currentTop !== null && newTop === s.topSpacing && s.currentTop < newTop) {
                // sticky is started && sticked at topSpacing && overflowing from top just finished
                s.stickyElement.trigger('sticky-bottom-unreached', [s]);
              }

              s.currentTop = newTop;
            }

            // Check if sticky has reached end of container and stop sticking
            var stickyWrapperContainer = s.stickyWrapper.parent();
            var unstick = (s.stickyElement.offset().top + s.stickyElement.outerHeight() >= stickyWrapperContainer.offset().top + stickyWrapperContainer.outerHeight()) && (s.stickyElement.offset().top <= s.topSpacing);

            if( unstick ) {
              s.stickyElement
              .css('position', 'absolute')
              .css('top', '')
              .css('bottom', 0)
              .css('z-index', '');
            } else {
              s.stickyElement
              .css('position', 'fixed')
              .css('top', newTop)
              .css('bottom', '')
              .css('z-index', s.zIndex);
            }
          }
        }
      },
      resizer = function() {
        windowHeight = $window.height();

        for (var i = 0, l = sticked.length; i < l; i++) {
          var s = sticked[i];
          var newWidth = null;
          if (s.getWidthFrom) {
            if (s.responsiveWidth) {
              newWidth = $(s.getWidthFrom).width();
            }
          } else if(s.widthFromWrapper) {
            newWidth = s.stickyWrapper.width();
          }
          if (newWidth != null) {
            s.stickyElement.css('width', newWidth);
          }
        }
      },
      methods = {
        init: function(options) {
          return this.each(function() {
            var o = $.extend({}, defaults, options);
            var stickyElement = $(this);

            var stickyId = stickyElement.attr('id');
            var wrapperId = stickyId ? stickyId + '-' + defaults.wrapperClassName : defaults.wrapperClassName;
            var wrapper = $('<div></div>')
            .attr('id', wrapperId)
            .addClass(o.wrapperClassName);

            stickyElement.wrapAll(function() {
              if ($(this).parent("#" + wrapperId).length == 0) {
                return wrapper;
              }
            });

            var stickyWrapper = stickyElement.parent();

            if (o.center) {
              stickyWrapper.css({width:stickyElement.outerWidth(),marginLeft:"auto",marginRight:"auto"});
            }

            if (stickyElement.css("float") === "right") {
              stickyElement.css({"float":"none"}).parent().css({"float":"right"});
            }

            o.stickyElement = stickyElement;
            o.stickyWrapper = stickyWrapper;
            o.currentTop    = null;

            sticked.push(o);

            methods.setWrapperHeight(this);
            methods.setupChangeListeners(this);
          });
        },

        setWrapperHeight: function(stickyElement) {
          var element = $(stickyElement);
          var stickyWrapper = element.parent();
          if (stickyWrapper) {
            stickyWrapper.css('height', element.outerHeight());
          }
        },

        setupChangeListeners: function(stickyElement) {
          if (window.MutationObserver) {
            var mutationObserver = new window.MutationObserver(function(mutations) {
              if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
                methods.setWrapperHeight(stickyElement);
              }
            });
            mutationObserver.observe(stickyElement, {subtree: true, childList: true});
          } else {
            if (window.addEventListener) {
              stickyElement.addEventListener('DOMNodeInserted', function() {
                methods.setWrapperHeight(stickyElement);
              }, false);
              stickyElement.addEventListener('DOMNodeRemoved', function() {
                methods.setWrapperHeight(stickyElement);
              }, false);
            } else if (window.attachEvent) {
              stickyElement.attachEvent('onDOMNodeInserted', function() {
                methods.setWrapperHeight(stickyElement);
              });
              stickyElement.attachEvent('onDOMNodeRemoved', function() {
                methods.setWrapperHeight(stickyElement);
              });
            }
          }
        },
        update: scroller,
        unstick: function(options) {
          return this.each(function() {
            var that = this;
            var unstickyElement = $(that);

            var removeIdx = -1;
            var i = sticked.length;
            while (i-- > 0) {
              if (sticked[i].stickyElement.get(0) === that) {
                splice.call(sticked,i,1);
                removeIdx = i;
              }
            }
            if(removeIdx !== -1) {
              unstickyElement.unwrap();
              unstickyElement
              .css({
                'width': '',
                'position': '',
                'top': '',
                'float': '',
                'z-index': ''
              })
              ;
            }
          });
        }
      };

  // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
  if (window.addEventListener) {
    window.addEventListener('scroll', scroller, false);
    window.addEventListener('resize', resizer, false);
  } else if (window.attachEvent) {
    window.attachEvent('onscroll', scroller);
    window.attachEvent('onresize', resizer);
  }

  $.fn.sticky = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }
  };

  $.fn.unstick = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.unstick.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }
  };
  $(function() {
    setTimeout(scroller, 0);
  });
}));


$(document).ready(function() {

  // http://api.ipstack.com/check
  // ? access_key = YOUR_ACCESS_KEY
  // jQuery example
  // $.getJSON('http://api.ipstack.com/check?access_key=44d848fdcdea99c78216da51a5ba8932 ', function (data) { 
  //   console.log(data); 
  // });

  // ipinfo
  // $.get("http://ipinfo.io", function (response) {
  //     console.log("IP: " + response.ip);
  //     console.log("Location: " + response.city + ", " + response.region);
  //     console.log(JSON.stringify(response, null, 4));
  // }, "jsonp");

  //ipdata
  var restrictedCountries = ["Italy", "Syria", "Maldives", "India"];
  var detected_country;
  $.get(" https://api.ipdata.co?api-key=d939ef5e6c20fd419e36b2408010fba598ce784a995134bead508192", function (response) {
    //     console.log(JSON.stringify(response, null, 4));
    //     console.log(response.country_code);
    var visiting_country = response.country_code;
    detected_country = response.country_name;
    if(visiting_country == "US") {
      setTimeout(function() {
        //         console.log($(".Popover__ValueList button.Popover__Value[data-value='Domestic']"), $("button.Popover__Value[data-value='Domestic']")[0], $(".Popover__Value--1")[1]);
        if($("button[data-value='Domestic']").length > 0) {
          $("button[data-value='Domestic']")[0].click();
        }

      }, 50);
    }
    else {
      setTimeout(function() {
        //         console.log($(".Popover__ValueList button.Popover__Value[data-value='Domestic']"), $("button.Popover__Value[data-value='Domestic']")[0], $(".Popover__Value--1")[1]);
        if($("button[data-value='International']").length > 0) {
          $("button[data-value='International']")[0].click();
        }

      }, 50);
    }
    //     console.log(detected_country, $.inArray(detected_country, restrictedCountries), "what");

    if($.inArray(detected_country, restrictedCountries) > -1) {
      //       console.log(visiting_country, "add active");
      $(".js-restricted-shipping-message").addClass("active");
      $(".js-restricted-shipping-message").html('International shipping is currently restricted for <strong class="restricted-country">'+ detected_country +'</strong>. For more information, please see our <a style="text-decoration: underline" href="https://5percentnutrition.com/pages/shipping-returns">shipping policies.</a>');
      // $(".restricted-country").text(detected_country);
    }
  }, "jsonp");


  // console.log("Sidebar", $(".SidebarMenu__Nav--primary .Collapsible:first").find(".Collapsible:first"));
  $(window).on("ready load resize", function() {
    if(window.matchMedia("(min-width: 1025px)").matches) {
      //     console.log($(".benefits-content__desc").length);
      //control benefits sections layout heading and image centering
      if($(".benefits-content__desc").length > 0) {
        for(var i = 0; i < $(".benefits-content__desc").length; i++) {
          //         console.log('90000', $($(".benefits-content__desc")[i]).text().length);
          if($($(".benefits-content__desc")[i]).text().length <= 1) {
            //           console.log('0');
            $($(".benefits-content__image")[i]).css("min-height", "170px")
          }
        } 
      }

    }

    //change left value of popover on window resize
    if(($($(".OptionSelector.Popover")[0]).attr("aria-hidden") == "false")) {
      //     console.log('1ope?');
      if(window.matchMedia("(min-width: 1025px)").matches) {
        $this = $($(".ProductForm__Item")[0]);
        var firstPopoverTop = ($this.offset().top - $(window).scrollTop()) + $this.outerHeight();
        var firstPopoverLeft = $this.offset().left;
        //       console.log(($this.offset().top - $(window).scrollTop()) + $this.outerHeight(), $($(".OptionSelector")[0]));
        $($(".OptionSelector")[0]).css({"top": firstPopoverTop, "left": firstPopoverLeft});      
      }
      else {
        $($(".OptionSelector")[0]).css({"top": firstPopoverTop, "left": 0});
      }
    }
    if(($($(".OptionSelector.Popover")[1]).attr("aria-hidden") == "false")) {
      //     console.log('2 ope?');
      if(window.matchMedia("(min-width: 1024px)").matches) {
        $this = $($(".ProductForm__Item")[1]);
        var secondPopoverTop = ($this.offset().top - $(window).scrollTop()) + $this.outerHeight();
        var secondPopoverLeft = $this.offset().left;
        $($(".OptionSelector")[1]).css({"top": secondPopoverTop, "left": secondPopoverLeft});      
      }
      else {
        $($(".OptionSelector")[1]).css({"top": secondPopoverTop, "left": 0});
      }
    }
    if($("#collection-sort-popover").attr("aria-hidden") == "false") {
      if(window.matchMedia("(min-width: 1025px)").matches) {
        $this = $("button[aria-controls='collection-sort-popover']");
        var sortPopoverTop = ($this.offset().top - $(window).scrollTop()) + $this.outerHeight();
        var sortPopoverLeft = $this.offset().left;
        $("#collection-sort-popover").css({"top": sortPopoverTop, "left": sortPopoverLeft});      
      }
      else {
        $("#collection-sort-popover").css({"top": sortPopoverTop, "left": 0});
      }
    }

  });

  $("button[aria-controls='collection-sort-popover']").on("click", function() {
    //     console.log('89');

    if(window.matchMedia("(min-width: 1025px)").matches) {
      var sortPopoverTop = ($(this).offset().top - $(window).scrollTop()) + $(this).outerHeight(),
          sortPopovertLeft = $(this).offset().left,
          sortPopoverWidth = $(this).width();
      //       console.log(sortPopoverTop, sortPopovertLeft, "width", sortPopoverWidth, $("#collection-sort-popover"));

      $("#collection-sort-popover").css({"top": sortPopoverTop, "left": sortPopovertLeft});
    }
    else {
      $("#collection-sort-popover").css({"top": sortPopoverTop, "left": 0});
    }

  })

  $(".ProductForm__Item").on("click", function(){
    //     console.log();
    var clickedElementIndex = $(this).closest(".ProductForm__Option").index();

    if(window.matchMedia("(min-width: 1025px)").matches) {
      // console.log($(this).find("svg"));

      // $(this).find("svg").css("transform", "rotate(180deg)");
      // console.log($(this), $(this).width(), $(this).offset().left, $(this).offset().top-$(window).scrollTop(), ($(this).offset().top-$(window).scrollTop()) + $(this).height());
      var firstPopoverTop = ($(this).offset().top - $(window).scrollTop()) + $(this).outerHeight(),
          firstPopovertLeft = $(this).offset().left,
          firstPopoverWidth = $(this).width();
      //       console.log(firstPopoverTop, firstPopovertLeft, $($(".OptionSelector")[0]));

      $($(".OptionSelector")[clickedElementIndex]).css({"top": firstPopoverTop, "left": firstPopovertLeft, "min-width": firstPopoverWidth + " !important"});

    }
    else {
      $($(".OptionSelector")[clickedElementIndex]).css({"top": firstPopoverTop, "left": 0});
    }

  })
  $(window).on("click", function() {
    // console.log($(this));
    // console.log($($(".OptionSelector.Popover")[0]).attr("aria-hidden"))
    // console.log($($(".OptionSelector.Popover")[1]).attr("aria-hidden"))
    if(($($(".OptionSelector.Popover")[0]).attr("aria-hidden") == "true" && $($(".OptionSelector.Popover")[1]).attr("aria-hidden") == "true")) {
      // $("body").removeClass("stop-scroll");
      console.log('start scroll');

    }
    else if(($($(".OptionSelector.Popover")[0]).attr("aria-hidden") == "true" && $($(".OptionSelector.Popover")[1]).attr("aria-hidden") == undefined)) {
      // $("body").removeClass("stop-scroll");
      console.log('start scroll');

    }
    else if(($($(".OptionSelector.Popover")[1]).attr("aria-hidden") == "true" && $($(".OptionSelector.Popover")[0]).attr("aria-hidden") == undefined)) {
      // $("body").removeClass("stop-scroll");
      //       console.log('start scroll');

    }
    else {
      // $("body").addClass("stop-scroll");
      // console.log('stop scroll');

    }

  });

  $(window).on("scroll", function() {
    if(($($(".OptionSelector.Popover")[0]).attr("aria-hidden") == "false")) {
      //       console.log('1ope?');
      if(window.matchMedia("(min-width: 1024px)").matches) {
        $this = $($(".ProductForm__Item")[0]);
        var firstPopoverTop = ($this.offset().top - $(window).scrollTop()) + $this.outerHeight();
        //         console.log(($this.offset().top - $(window).scrollTop()) + $this.outerHeight(), $($(".OptionSelector")[0]));
        $($(".OptionSelector")[0]).css("top", firstPopoverTop);      
      }
      else {
        $($(".OptionSelector")[0]).css({"top": firstPopoverTop, "left": 0});
      }
    }
    if(($($(".OptionSelector.Popover")[1]).attr("aria-hidden") == "false")) {
      //       console.log('2 ope?');
      if(window.matchMedia("(min-width: 1024px)").matches) {
        $this = $($(".ProductForm__Item")[1]);
        var secondPopoverTop = ($this.offset().top - $(window).scrollTop()) + $this.outerHeight();
        $($(".OptionSelector")[1]).css("top", secondPopoverTop);      
      }
      else {
        $($(".OptionSelector")[1]).css({"top": secondPopoverTop, "left": 0});
      }
    }
    if($("#collection-sort-popover").attr("aria-hidden") == "false") {
      if(window.matchMedia("(min-width: 1025px)").matches) {
        $this = $("button[aria-controls='collection-sort-popover']");
        var sortPopoverTop = ($this.offset().top - $(window).scrollTop()) + $this.outerHeight();
        $("#collection-sort-popover").css("top", sortPopoverTop);      
      }
      else {
        $("#collection-sort-popover").css({"top": sortPopoverTop, "left": 0});
      }
    }
  });

  $(".HorizontalList__Item").on("mouseenter", function() {
    // console.log('enter');
    if($(this).children(".DropdownMenu").length > 0) {
      // console.log($(this).children(".DropdownMenu").length);

      // console.log('dropdown exists');

    }

  })
  $(".HorizontalList__Item").on("mouseleave", function() {
    // console.log('leave');


  })

  if($(".homepage-instagram-feed").length > 0) {
    $(".homepage-instagram-feed").parent().removeClass("shopify-section--bordered");
  }




  $(".Popover__ValueList:first").on("click", "button", function() {
    // console.log($(this).index());
    var clickedSupplementIndex = $(this).index();
    $('.js-variants-supplements-container').prop('selectedIndex', clickedSupplementIndex).selectric('refresh');
    $('.js-variants-supplements-container').trigger("change");

  })

  $("button.Popover__Value").on("click", function() {
    //     console.log('.Popover__ValueList:first');
    var productName = $(".js-restricted-shipping-message").data("title");
    setTimeout(function() {
      //       console.log(detected_country, restrictedCountries, $.inArray(detected_country, restrictedCountries) > -1, $($(".product-variant-container .ProductForm__Option button .ProductForm__OptionName")[1]).text());

      if($($(".product-variant-container .ProductForm__Option button .ProductForm__OptionName")[1]).text() == "International" && $.inArray(detected_country, restrictedCountries) > -1) {
        //         console.log('show restriction message');
        if($(".js-restricted-shipping-message").length > 0 && $(".js-restricted-shipping-message").hasClass("active")) {
          // do nothing
        }
        else {
          $(".js-restricted-shipping-message").addClass("active");
          $(".js-restricted-shipping-message").html('International shipping is currently restricted for <strong class="restricted-country">'+ detected_country +'</strong>. For more information, please see our <a style="text-decoration: underline" href="https://5percentnutrition.com/pages/shipping-returns">shipping policies.</a>');
        }
      }
      else if($($(".product-variant-container .ProductForm__Option button .ProductForm__OptionName")[1]).text() == "Domestic" && detected_country != "United States") { //when customer is located internationally but selects domestic product
        //         console.log('wassup international bitch');
        $(".js-restricted-shipping-message").addClass("active");
        $(".js-restricted-shipping-message").html('<strong>' + productName + '</strong>' + " " + 'has several variants including those specific to U.S. and international consumers. Please make sure you select the appropriate variant based on your location; where product(s) are being shipped. Orders outside of the United States could be subject to import taxes and customs duties charged by the destination country.');
      }
      else if($($(".product-variant-container .ProductForm__Option button .ProductForm__OptionName")[1]).text() == "International" && detected_country === "United States") { //when customer is located domestically but selects international product
        //         console.log('wassup domestic bitch');
        $(".js-restricted-shipping-message").addClass("active");
        $(".js-restricted-shipping-message").html('<strong>' + productName + '</strong>' + " " +  'has been formulated for our international customers. If you are ordering from North America, please be sure to select the correct product variant.');
      }
      else {
        //         console.log('remove active');

        if($(".js-restricted-shipping-message").length > 0 && $(".js-restricted-shipping-message").hasClass("active")) {
          $(".js-restricted-shipping-message").removeClass("active")
        }
        else {
          // do nothing
        }
      }
    }, 50);

  })



  // set a readmore button on product description
  // console.log($(".product-description-text-container").height());
  if($(".product-description-text-container").height() > 400) {
    $(".product-description-text-container").addClass("to-expand");
    $(".g-read-more").addClass("active");
  }
  $(".g-read-more").on("click", function() {
    $(".g-read-more").toggleClass("read-less");
    if($(".g-read-more").hasClass("read-less")) {
      $(".product-description-text-container.to-expand").css("max-height", "4000px");
      $(".g-read-more").text("+ Read Less");
    }
    else {
      $(".g-read-more").text("+ Read More");
      $(".product-description-text-container").css("max-height", "400px");
      $("html, body").animate({ scrollTop: $(".product-description-text-container").offset().top }, 800);
    }


  })
  // $(".read-less").on("click", function() {
  //   $(".g-read-more").removeClass("read-less");

  //   // $(".read-less").text("+ Read Less");
  // })
  //  setTimeout(function() {

  $(".SidebarMenu__Nav--primary .Collapsible:first").find(".Collapsible:first").css("display", "none")
  $(".SidebarMenu__Nav--primary .Collapsible:nth-child(2)").find(".Collapsible:first").css("display", "none")
  $(".product-button--nav").on("click", function() {
    // console.log('poop');

    $("html, body").animate({ scrollTop: 0 }, 800);
    setTimeout(function() {
      $(".main-product-form").addClass("wiggle");
    }, 1000)
    setTimeout(function() {
      $(".main-product-form").removeClass("wiggle");
    }, 1500)
  })
  // mutation observer to detect the adding of sold out button to the DOM
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // console.log(mutation)
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // element added to DOM
        var hasClass = [].some.call(mutation.addedNodes, function(el) {
          return el.id == "BIS_frame"
        });
        // console.log(hasClass);

        if (hasClass) {
          // element has class `MyClass`
          // console.log('element ".MyClass" added');
          $("#BIS_trigger").html("<span class='sold-out-text'>SOLD OUT!</span><span class='email-availability-text'>EMAIL WHEN AVAILABLE</span>");
        }
      }
    });
  });

  var config = {
    attributes: true,
    childList: true,
    characterData: true
  };

  observer.observe(document.body, config);

  //  $("#BIS_trigger").initialize(function() {
  //   console.log('haha');
  //   $("#BIS_trigger").html("<span class='sold-out-text'>SOLD OUT!</span><span class=email-availability-text''>EMAIL WHEN AVAILABLE</span>");
  //  })

  //  }, 2000);


  $(".Popover__Value").on("click", function() {
    //  console.log('clicked');
    if($(".main-add-to-cart").hasClass("Button--secondary")) {
      $(".main-add-to-cart").css("display", "none")
    }
    else {
      $(".main-add-to-cart").css("display", "flex");
    }

    if($(".js-quantity-and-addToCart-container .ajaxified-cart-feedback").length > 0) {
      $(".js-quantity-and-addToCart-container .ajaxified-cart-feedback").remove();
    }

  })
  // change the focus border color of search form 
  //  $("form").on("click", function() {
  //     console.log('document clidkc');

  //     if ($("input.js-search-input-field").is(":focus")) {
  //       alert('focus');
  //     }
  //  })
  // if($("input.js-search-input-field").is(":focus")) {
  //   console.log('focused');

  // }

  // always scroll to top of the page on page refresh
  $(this).scrollTop(0);

  // sticky for product navigation bar
  $(".js-product-nav-section").sticky({ topSpacing: 84 });
  $(".main-site-header").sticky({topSpacing: 0})




  // console.log($(".Drawer__Main--sidenav").height());
  $(".Drawer__Container--sidenav").outerHeight($(".Drawer__Main--sidenav").outerHeight());

  // START: search bar functionality

  // clear search
  $(".clearable").each(function() {

    var $inp = $(this).find("input:text"),
        $cle = $(this).find(".clearable__clear");

    $inp.on("input", function(){
      $cle.toggle(!!this.value);
    });

    $cle.on("touchstart click", function(e) {
      e.preventDefault();
      $inp.val("").trigger("input");
    });

  });

  // show search bar on clicking search icon
  $(".js-open-searchMobile").on("click", function() {
    $(".nav-search").toggleClass("active");
    if($(".nav-search").hasClass("active")) {
      $(".nav-search").focus();
    }
  })

  // END: search bar functionality



  $(".js-show-tabletNav").on("click", function() {
    $(".js-header-main-nav").toggleClass("active");
    $(".PageOverlay").toggleClass("is-visible-tab");
    $(".AnnouncementBar").toggleClass("inactive");

  });
  $(".PageOverlay").on("click", function() {
    if($(".js-header-main-nav").hasClass("active")) {
      $(".js-header-main-nav").removeClass("active");
      $(".PageOverlay").removeClass("is-visible-tab");
      $(".AnnouncementBar").toggleClass("inactive");
    }
  })

  $(".Popover__Value").on("click", function(e) {
    // console.log('popover valiue');
    e.preventDefault();
    // return false;

  })


  //       console.log('here!');

  $(".HorizontalList__Item[data-navname='5% NATION']").addClass("five-nation-nav");
  $(".HorizontalList__Item[data-navname='5% NATION'] .DropdownMenu .Linklist").addClass
  ("Linklist--five-nation");
  // console.log($(".Linklist--five-nation").find(".Link--shopnow"));
  var fivenationShopBtn = $(".Linklist--five-nation").find(".Link--shopnow");
  // console.log(fivenationShopBtn[1]);
  if(fivenationShopBtn.length > 0) {
    fivenationShopBtn[0].innerHTML = "VIEW ALL";
    fivenationShopBtn[1].innerHTML = "GET CONNECTED";
    fivenationShopBtn[2].innerHTML = "JOIN TEAM";
    fivenationShopBtn[3].innerHTML = "VIEW ALL"; //JS04012020
  }


  // supplement table change of changing variant in dropdown
  if($("#supplementFactsSection").length > 0) {
    $(".js-variants-supplements-container").selectric({
      arrowButtonMarkup: '<b class="button"><svg class="Icon Icon--select-arrow" role="presentation" viewBox="0 0 19 12"><polyline fill="none" stroke="currentColor" points="17 2 9.5 10 2 2" fill-rule="evenodd" stroke-width="2" stroke-linecap="square"></polyline></svg></b>',
      onOpen: function() {
        //           console.log($(this).siblings(".selectric").find("button"));

      },
    });
    var defaultSupplementVariant = $('.js-variants-supplements-container :selected').text().trim();
    var defaultSupplementVariantClass = defaultSupplementVariant.replace(/ /g, '-');
    // console.log(defaultSupplementVariantClass, "default supplement");
    $("." + defaultSupplementVariantClass).css("display", "block");

    // changing display of supplements table according to seletion from dropdown
    $(".js-variants-supplements-container").on("change", function() {
      //         console.log("change")
      var selectedSupplementVariant = $('.js-variants-supplements-container :selected').text().trim();
      selectedSupplementVariant = selectedSupplementVariant.replace(/(\r\n|\n|\r)/gm,"");

      for(var start = 0 ; start < selectedSupplementVariant.length ; start ++){

        if(selectedSupplementVariant[start] != " "){
          break;
        }
      }

      for(var end = selectedSupplementVariant.length - 1 ; end > start ; end --){

        if(selectedSupplementVariant[end] != " "){
          break;
        }
      }

      selectedSupplementVariant = selectedSupplementVariant.substring(start,end+1);

      var selectedSupplementVariantClass = selectedSupplementVariant.replace(/ /g, '-');
      // console.log(selectedSupplementVariantClass);

      $(".supplement-info > div").css("display", "none");
      $("." + selectedSupplementVariantClass).css("display", "block");
    })
    $('.variant-name-mobile:first').addClass("active");
    $('.variant-name-mobile').on('click', function() {
      $('.variant-name-mobile').removeClass("active");
      //         console.log($(this).index());
      $(this).addClass("active");
      var clickedIndex = $(this).index();

      $(".js-variants-supplements-container").prop('selectedIndex', clickedIndex).selectric('refresh');
      $('.js-variants-supplements-container').trigger("change");
    });
  }
  // show relevant table on page load

  // set the first option of each select box as active
  $(".frequent-variants-container").find('option:eq(0)').prop('selected', true);
  $(".frequent-variants-container").prop('selectedIndex', 0).selectric('refresh');

  // Selectrix initialisation (for styling the select boxes)
  $('.frequent-variants-container').selectric({
    highlight: false,
    arrowButtonMarkup: '<b class="button"><svg class="Icon Icon--select-arrow" role="presentation" viewBox="0 0 19 12"><polyline fill="none" stroke="currentColor" points="17 2 9.5 10 2 2" fill-rule="evenodd" stroke-width="2" stroke-linecap="square"></polyline></svg></b>',
    onOpen: function() {
      //         console.log($(this));

    },
  });


  // get the variant id of selected frequently bought product
  // console.log("metadata", $(".frequently-bought-metadata").length);
  $(".frequent-variants-container").on("change", function() {
    //       console.log("dropdown");
    // change add to cart button settings
    if($(".frequent-go-cart-text").hasClass("active")) {
      $(".frequent-go-cart-text").removeClass("active");
      $(".frequent-add-cart-text").addClass("active");
    }

    if($(".frequent-notinstock").length > 0) {
      $(".frequent-notinstock").remove();
    }
    var classVariant = $(this).attr('class').split(/\s+/)[1];
    // console.log(classVariant, $("."+classVariant));
    // console.log($(this).siblings("." + classVariant).length);
    // if($(this).siblings("." + classVariant).length > 0) {
    //   console.log($(this).siblings("." + classVariant).find(":selected").text().trim());
    //   selectedVariant = $(this).find(":selected").text().trim()
    // }
    var word = "";
    for(var i = 0; i < $("."+classVariant).length; i++) {
      // console.log($("." + classVariant)[i].value);
      if(i == 1) {
        word = word + " / " + $("." + classVariant)[i].value;
      }
      else {
        word = word + $("." + classVariant)[i].value;
      }

    }
    //       console.log("word", word);
    var metaDataList = $(".selectric-" + classVariant).siblings(".frequently-bought-metadata").children("li");
    //       console.log(metaDataList);
    for(var i = 0; i < metaDataList.length; i++) {
      // console.log(variantId[i].dataset.title);
      if(metaDataList[i].dataset.title == word) {
        // console.log(variantId[i].dataset.variantid);
        var selectedVariant = metaDataList[i].dataset.variantid;
        var inventoryQuantity = metaDataList[i].dataset.variantquantity;
      }
    }
    // console.log($("."+classVariant), metaDataList);

    // console.log($(this), $(this).closest(".frequent-variant-wrapper").siblings(".frequent-checkbox").find(".js-frequent-product-checkbox").attr("data-variant-id"));
    $(this).closest(".frequent-variant-wrapper").siblings(".frequent-checkbox").find(".js-frequent-product-checkbox").attr("data-variant-id", selectedVariant);
    $(this).closest(".frequent-variant-wrapper").siblings(".frequent-checkbox").find(".js-frequent-product-checkbox").attr("data-inventory-quantity", inventoryQuantity);
    // console.log(selectedVariant, inventoryQuantity);

    // console.log($(this).find(":selected").text().trim());



  });

  // $(".Linklist--five-nation").find(".Link--shopnow").html("Learn More");
  $("#frequently-added-form").submit(function(event){
    // console.log($('.js-frequent-product-checkbox'));
    var productArray = [];
    var addToCart = true;

    $('.js-frequent-product-checkbox').each(function(){
      // console.log($(this));

      var id = $(this).attr('data-variant-id');
      var quantity = 1;
      var inStock = $(this).attr('data-inventory-quantity');
      // console.log('cart.js', $(this), id, quantity, $(this).is(":checked"), inStock);

      if($(this).is(":checked") && inStock > 0) {
        addToCart = true;
        // console.log("is checked", id, quantity);
        productArray.push([id, quantity]);
        // CartJS.addItem(id, quantity, {
        //   "success": function(data, textStatus, jqXHR) {
        //       console.log('Added!');
        //   },
        //   "error": function(jqXHR, textStatus, errorThrown) {
        //       console.log('Error: ' + errorThrown + '!');
        //   }});


        // window.location.href = "https://5percent-nutrition.myshopify.com/cart"
      }
      if($(this).is(":checked") && !(inStock > 0)) {
        //             console.log($(this), "not in stock");
        $(this).closest(".frequent-checkbox").siblings(".frequent-variant-wrapper").append("<p class='frequent-notinstock'>Selected variant combination not in stock</p>")
        addToCart = false;
        return false;

      }
    });
    // console.log("add to cart?", addToCart);
    if(addToCart == true) {
      // console.log(productArray, "add to cart whooopeee");
      for(let i = 0; i < productArray.length; i++) {
        // console.log(productArray[i]);
        CartJS.addItem(Number(productArray[i][0]), productArray[i][1], {
          "success": function(data, textStatus, jqXHR) {
            //                   console.log('Added!');
            $(".frequent-adding-cart-text").addClass("active");
            $(".frequent-add-cart-text").removeClass("active");

          },
          "error": function(jqXHR, textStatus, errorThrown) {
            console.log('Error: ' + errorThrown + '!');
          }});
      }

    }
    $(".ProductForm").on("submit", function(e) {
      e.preventDefault();
    })


    $(document).on('cart.requestComplete', function(event, cart) {
      $('.Header__CartCount').html(cart.item_count);
      //           console.log(cart.item_count);
      //           console.log($(this));
      $(".frequent-go-cart-text").addClass("active");
      $(".frequent-adding-cart-text").removeClass("active");

      // window.location.href = "https://5percent-nutrition.myshopify.com/cart"
      // CartJS.addItem(id, quantity, {
      //   "success": function(data, textStatus, jqXHR) {
      //       console.log('Added!');
      //   },
      //   "error": function(jqXHR, textStatus, errorThrown) {
      //       console.log('Error: ' + errorThrown + '!');
      //   }});

    });
    event.preventDefault();
    // window.location.href = "https://5percent-nutrition.myshopify.com/cart"
  });  
  // });

  // add wishlist to top of the page
  setTimeout(function() {
    //  console.log('2200');

    $(".swym-button-bar").insertAfter(".swym-button-custom");
    // console.log($(".yotpo-regular-box .write-question-button"));
    $(".js-review-btns-container").append($(".yotpo-regular-box .write-review-button")[1]);
    $(".js-review-btns-container").append($(".yotpo-regular-box .write-question-button")[1]);


    // x.append($(".yotpo-regular-box .write-question-button"));
    // $(".yotpo-regular-box .write-question-button").appendTo(x);
  }, 5200);


  // Benefits section slider control mobile and desktop view control
  $(window).on("ready load resize", function() {
    // console.log('ready load resize');
    if($(".PageOverlay").hasClass("is-visible")) {
      $(".PageOverlay").removeClass("is-visible");
    }
    else if($(".PageOverlay").hasClass("is-visible-tab")) {
      $(".PageOverlay").removeClass("is-visible-tab");
    }
    if($(".js-header-main-nav").hasClass("active")) {
      $(".js-header-main-nav").removeClass("active");
      $(".AnnouncementBar").removeClass("inactive");
    }
    // if($(".mobile-sidenav").attr("aria-hidden", "false")) {
    //   $(".mobile-sidenav").attr("aria-hidden", "true")
    // }
    if(window.matchMedia("(max-width: 767px)").matches) {
      if($(".js-benefits-slider").length > 0) {
        startBenefitsSlick();
      }

    }
    else {
      if($(".js-benefits-slider").length > 0) {
        //         console.log('0000');
        stopBenefitsSlick();
      }

    }
  })

  function startBenefitsSlick() {
    $(".js-benefits-slider").slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      fade: true,
      // nextArrow: true,
      dots: true
    });
    $(".js-benefits-slider .slick-dots").append("<li class=\"next-benefit-custom\"></li>");
    setTimeout(function() {
      var slickNextBtn1 = document.getElementsByClassName("next-benefit-custom")[0];
      // console.log(slickNextBtn1, document.getElementsByClassName("next-benefit-custom")[0]);
      slickNextBtn1.addEventListener("click", nextBenefitsSlide);	
    }, 100)	
  }

  function stopBenefitsSlick() {
    try{
      $(".js-benefits-slider").slick("unslick");
    }catch(e){}
  }


  function nextBenefitsSlide() {
    // console.log('nextslide');
    try{
      $(".js-benefits-slider").slick('slickNext');
    }catch(e){}
  }

  // Image gallery slider

  $(".js-product-gallery-slider").slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: true,
    // nextArrow: true,
    dots: true,
    asNavFor: ".js-thumbnail-gallery-slider",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          adaptiveHeight: true,
        }
      }
    ]
  });
  $(".js-thumbnail-gallery-slider").slick({
    slidesToShow: 5,
    slidesToScroll: 1,
    asNavFor: ".js-product-gallery-slider",
    focusOnSelect: true,
    infinite: "false",
    vertical: true,
    // verticalSwiping: true,
    arrows: true,
    prevArrow:"<button type='button' class='slick-arrow slick-arrow--prev pull-left'><i class=''><svg class=\"Icon Icon--select-arrow\" role=\"presentation\" viewBox=\"0 0 19 12\"><polyline fill=\"none\" stroke=\"currentColor\" points=\"17 2 9.5 10 2 2\" fill-rule=\"evenodd\" stroke-width=\"2\" stroke-linecap=\"square\"></polyline></svg></i></button>",
    nextArrow:"<button type='button' class='slick-arrow slick-arrow--next pull-right'><i class=''><svg class=\"Icon Icon--select-arrow\" role=\"presentation\" viewBox=\"0 0 19 12\"><polyline fill=\"none\" stroke=\"currentColor\" points=\"17 2 9.5 10 2 2\" fill-rule=\"evenodd\" stroke-width=\"2\" stroke-linecap=\"square\"></polyline></svg></i></button>"
    // dots: "false"
  });
  if($(".js-thumbnail-gallery-slider").find(".video-container").length > 0) {
    // console.log('video exists');
    $(".slick-dots li:nth-child(2)").addClass("video-dot");

  }
  // $('.js-thumbnail-gallery-slider').on('mouseenter', '.slick-slide', function (e) {
  //   // console.log('entered');

  //   var $currTarget = $(e.currentTarget), 
  //       index = $currTarget.data('slick-index'),
  //         slickObj = $('.js-thumbnail-gallery-slider').slick('getSlick');
  //     // console.log($currTarget, index, slickObj);

  //     // slickObj.slickGoTo(index);
  //     $(".js-product-gallery-slider").slick("slickGoTo", index, false)

  // });
  $(".Product__SlideshowNav--thumbnails").css("visibility", "visible");
  $(".js-product-gallery-slider").css("visibility", "visible");
  setTimeout(function() {
    // imageZoom();
  }, 100);

  // image zoom
  // function imageZoom() {
  //   console.log('init');

  //   $('.image-zoom')
  //   .parent()
  //   .zoom({
  //     url: $(this).find('img').attr('data-zoom')
  //   });
  // }
  // $(".js-product-gallery-slider").on("beforeChange", function() {
  //   $('.image-zoom').trigger('zoom.destroy');
  //   setTimeout(function() {
  //     imageZoom();
  //   },100);

  // })
  if($(".js-product-gallery-slider").length > 0) {
    $(".js-product-gallery-slider .slick-dots").append("<li class=\"next-slide-custom\"></li>");
    setTimeout(function() {
      var slickNextBtn = document.getElementsByClassName("next-slide-custom")[0];
      // console.log(slickNextBtn, document.getElementsByClassName("next-slide-custom")[0]);
      slickNextBtn.addEventListener("click", nextSlide);	
    }, 100);
  }


  // thumbnails slider arrow buttons control
  $(".js-thumbnail-gallery-slider").on("afterChange", function() {
    if($(".Product__SlideshowNavImage:first").hasClass("slick-current")) {
      $(".js-thumbnail-gallery-slider .slick-arrow--prev").css("max-height", "00px");
    }
    else {
      $(".js-thumbnail-gallery-slider .slick-arrow--prev").css("max-height", "40px");
    }

    if($(".Product__SlideshowNavImage:last").hasClass("slick-active")) {
      $(".js-thumbnail-gallery-slider .slick-arrow--next").css("max-height", "0px");
    }
    else {
      $(".js-thumbnail-gallery-slider .slick-arrow--next").css("max-height", "40px");
    }
  })

  function stopSlick() {
    try{
    $(".js-product-imagesSlider").slick("unslick");
    }catch(e){}
  }

  function nextSlide() {
    $(".js-product-gallery-slider").slick('slickNext');
  }
  // responsive slick
  $(window).on('resize orientationchange', function() {
    $('.js-product-gallery-slider').slick('refresh');
    $('.js-thumbnail-gallery-slider').slick('refresh');

  });

  // JS040119 sizechart popup
  $('.image-popup-vertical-fit').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    mainClass: 'mfp-img-mobile',
    gallery: {	// JS Added 20191106 - added gallery code for cycling through on mobile
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      verticalFit: true
    }

  });
  // end sizechart popup

  // video popup
  $('.product-video').magnificPopup({
    type: 'iframe',
    iframe: {
      markup: '<div class="mfp-iframe-scaler">'+
      '<div class="mfp-close"></div>'+
      '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
      '</div>', // HTML markup of popup, `mfp-close` will be replaced by the close button

      patterns: {
        youtube: {
          index: 'youtube.com/', // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).

          id: 'v=', // String that splits URL in a two parts, second part should be %id%
          // Or null - full URL will be returned
          // Or a function that should return %id%, for example:
          // id: function(url) { return 'parsed id'; }

          src: '//www.youtube.com/embed/%id%?autoplay=1' // URL that will be set as a source for iframe.
        },
        vimeo: {
          index: 'vimeo.com/',
          id: '/',
          src: '//player.vimeo.com/video/%id%?autoplay=1'
        },
        gmaps: {
          index: '//maps.google.',
          src: '%id%&output=embed'
        }

        // you may add here more sources

      },

      srcAction: 'iframe_src', // Templating object key. First part defines CSS selector, second attribute. "iframe_src" means: find "iframe" and set attribute "src".
    }
  });


  // FAQ accordion
  var acc = document.getElementsByClassName("js-accordion-heading");
  var i;

  for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
      for (let j = 0; j < acc.length; j++) { 
        acc[j].classList.remove("active");
        acc[j].nextElementSibling.style.maxHeight = null;
      }
      this.classList.add("active");
      var panel = this.nextElementSibling;
      if (panel.style.maxHeight){
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      } 
    });
  }

  // product navigation bar actions

  // back to the top button
  $('.beam-me-up-scotty').click(function(){
    // console.log('beaminfg');

    $("html, body").animate({
      scrollTop: 0
    }, 1000);
  });


  // var distance = $('.product-description-section').offset().top,
  $window = $(window);
  if($('.product-description-section').length > 0) {
    $(window).on("scroll", function() {
      // console.log('heres faq section outside for', "window scroll top:", $window.scrollTop(), "faq section offset", $('.js-product-faq-section').offset().top, "faq section length", ($('.js-product-faq-section').offset().top + $('.js-product-faq-section').height()), ($('.js-product-faq-section').offset().top + $('.js-product-faq-section').height() - 100));
      // console.log('scrolling');
      // console.log('heres faq section outside for', "window scroll top:", $window.scrollTop(), "desc section offset", $('.js-product-description-section').offset().top, "desc section length", ($('.js-product-description-section').offset().top + $('.js-product-description-section').height()), ($('.js-product-description-section').offset().top + $('.js-product-description-section').height() - 100));
      if($window.scrollTop() > $('.product-description-section').offset().top) {
        // console.log('>0');
        $(".beam-me-up-scotty").css("visibility", "visible")
      }
      else {
        // console.log('<0');
        $(".beam-me-up-scotty").css("visibility", "hidden");
      }



      // 
      if($('.js-product-faq-section').length > 0 && $window.scrollTop() > $('.js-product-faq-section').offset().top - 101 && $window.scrollTop() < ($('.js-product-faq-section').offset().top + $('.js-product-faq-section').height() - 101)) {
        // console.log('heres faq section inside for', $window.scrollTop(), $('.js-product-faq-section').offset().top-101, ($('.js-product-faq-section').offset().top + $('.js-product-faq-section').height()), ($('.js-product-faq-section').offset().top + $('.js-product-faq-section').height() - 100));
        $(".js-product-nav-elements li").removeClass("active");
        $(".js-faq").addClass("active");
      }
      else if($('.js-fivenation-section').length > 0 && $window.scrollTop() > $('.js-fivenation-section').offset().top - 101 && $window.scrollTop() < ($('.js-fivenation-section').offset().top + $('.js-fivenation-section').height()) - 101) {
        // console.log('heres 5 percent');
        $(".js-product-nav-elements li").removeClass("active");
        $(".js-five-percent-nation").addClass("active");
      }
      else if($('.js-review-section').length > 0 && $window.scrollTop() > $('.js-review-section').offset().top - 101 && $window.scrollTop() < ($('.js-review-section').offset().top + $('.js-review-section').height()) - 101) {
        // console.log('heres review section');
        $(".js-product-nav-elements li").removeClass("active");
        $(".js-reviews").addClass("active");
      }
      else if($('.js-supplement-section').length > 0 && $window.scrollTop() > $('.js-supplement-section').offset().top - 101 && $window.scrollTop() < ($('.js-supplement-section').offset().top + $('.js-supplement-section').height()) - 101) {
        // console.log('heres supplements');
        $(".js-product-nav-elements li").removeClass("active");
        $(".js-supplements").addClass("active");
      }
      else if($(".js-benefits-section").length > 0 && $('.js-product-description-section').length > 0 && $window.scrollTop() > $('.js-product-description-section').offset().top  - 101 && $window.scrollTop() < ($('.js-product-description-section').offset().top + $('.js-product-description-section').height() + $('.js-benefits-section').height()) - 101) {
        // console.log('heres description');
        $(".js-product-nav-elements li").removeClass("active");
        $(".js-description").addClass("active");
      }
      else if($(".js-benefits-section").length == 0 && $('.js-product-description-section').length > 0 && $window.scrollTop() > $('.js-product-description-section').offset().top - 101 && $window.scrollTop() < ($('.js-product-description-section').offset().top + $('.js-product-description-section').height()) - 101) {
        // console.log('heres description1');
        $(".js-product-nav-elements li").removeClass("active");
        $(".js-description").addClass("active");
      }

    })
  }
  // control active element highlight
  $(".js-product-nav-elements li").on("click", function() {
    $this = $(this);
    setTimeout(function() {
      $(".js-product-nav-elements li").removeClass("active");
      $this.addClass("active");
    }, 100)

  });

  $(".product-page--thumb").on("click", function() {
    //       console.log($(this).index());

  })


  // smooth scroll on clicking section name
  // Add smooth scrolling to all links
  $(".scrollTo").on('click', function(event) {


    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;
      // console.log($(hash).offset().top - 330);
      var scrollValue = $(hash).offset().top - 100;
      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
      $('html, body').animate({
        scrollTop: scrollValue
      }, 800, function(){

        // Add hash (#) to URL when done scrolling (default click behavior)
        // window.location.hash = hash;
      });
    } // End if
  });

  // frequently bought total currency handling
  //set all the chekboxes of all the frequently bought products as active
  $('.js-frequent-product-checkbox').prop('checked', true);


  var initialTotal = $(".js-frequent-product-priceTotal").data("total");
  //  console.log('initial total', initialTotal);
  initialTotal = initialTotal / 100;
  //  console.log($(".Price--compareAt--frequent").length);
  var compareAtTotal = 0;
  for(var i = 0; i < $(".Price--compareAt--frequent").length; i++) {
    //  console.log("compareat",i , $(".Price--compareAt--frequent")[i].innerHTML);

    compareAtTotal = compareAtTotal + Number(($(".Price--compareAt--frequent")[i].innerHTML).substr(1));
    // console.log(compareAtTotal);

  }
  // console.log(compareAtTotal);
  compareAtTotal = Math.round(compareAtTotal * 100) / 100;

  if(initialTotal == 0) {
    $(".js-frequent-totalPrice").html("$ 0");
  }
  else {
    $(".js-frequent-totalPrice").html("$ " + initialTotal);
    $(".js-frequent-totalPrice").attr("data-revisedTotalPrice", initialTotal);
  }
  if(initialTotal != compareAtTotal) {
    $(".js-frequent-compareAt").html("$" + compareAtTotal);
    $(".js-frequent-compareAt").attr("data-revisedCompareAt", compareAtTotal);
    // console.log(compareAtTotal, initialTotal);

    var discountPrice = ((compareAtTotal - initialTotal) / compareAtTotal) * 100;
    discountPrice = Math.round(discountPrice * 100) / 100;
    // console.log(discountPrice)
    $(".js-frequent-discount").html(discountPrice + "% OFF");
  }
  else {
    $(".js-frequent-compareAt").css("display", "none");
    $(".js-frequent-discount").css("display", "none")
  }



  // change price on change of checkbox in frequently bought products
  $(".js-frequent-product-checkbox").change(function() {
    //  console.log('changed');
    //change cart button settings
    if($(".frequent-go-cart-text").hasClass("active")) {
      $(".frequent-go-cart-text").removeClass("active");
      $(".frequent-add-cart-text").addClass("active");
    }

    if($('.js-frequent-product-checkbox:checked').length == 0) {
      $(".js-frequent-product-priceTotal").css({"max-height": "0", "padding-top": "0px"});
    }
    else {
      $(".js-frequent-product-priceTotal").css({"max-height": "200px", "padding-top": "10px"});
    }
    if(this.checked) {
      // $(this).prop("checked", returnVal);
      // console.log($(this).attr("id"));
      var targetId = $(this).attr("id");
      // console.log(targetId, "is checked");
      // id of input checkboxes are same as classes on the divs that have the prices
      $("."+ targetId).addClass("active-price");
    }
    else {
      // console.log('unchecked');
      // console.log($(this).attr("id"), "is unchecked");
      var targetId = $(this).attr("id");
      $("."+ targetId).removeClass("active-price")

    }

    // console.log(($(".active-price").length));
    var numberOfActiveProducts = ($(".active-price").length);
    // console.log("no. of active products", numberOfActiveProducts);

    var i = 0;
    var updatedTotal = 0;
    var updatedCompareAt = 0;
    var updatedDiscount = 0;
    while(i < numberOfActiveProducts) {
      // console.log($(".active-price .Price--highlight--frequent")[i].innerHTML, "price", i);
      // console.log($(".active-price .Price--compareAt--frequent")[i].innerHTML, "compareat", i);

      var updatedTotal = updatedTotal + Number(($(".active-price .Price--highlight--frequent")[i].innerHTML).substr(1));
      // if($(".active-price .Price--compareAt--frequent").length > 0) {
      // console.log($(".active-price .Price--compareAt--frequent").length);
      var updatedCompareAt = updatedCompareAt + Number(($(".active-price .Price--compareAt--frequent")[i].innerHTML).substr(1));
      // console.log("updatedCompareAt", updatedCompareAt);
      // console.log("updatedTotal", updatedTotal);
      i++;
    }
    updatedTotal = Math.round(updatedTotal * 100) / 100;
    updatedCompareAt = Math.round(updatedCompareAt * 100) / 100;
    // console.log(updatedTotal, updatedCompareAt);

    // if(updatedCompareAt > 0) {
    //   updatedCompareAt = Math.round(updatedCompareAt * 100) / 100;

    // }
    if(updatedCompareAt != updatedTotal) {

      updatedDiscount = ((updatedCompareAt - updatedTotal) / updatedCompareAt) * 100;
      updatedDiscount = Math.round(updatedDiscount * 100) / 100;
      // console.log(updatedDiscount, "updatedDiscoung");
      $(".js-frequent-compareAt").html("$ " + updatedCompareAt);
      $(".js-frequent-discount").html(updatedDiscount + " % OFF");
      $(".js-frequent-compareAt").css("display","inline-block");
      $(".js-frequent-discount").css("display","inline-block");
    }
    else {
      $(".js-frequent-compareAt").css("display","none");
      $(".js-frequent-discount").css("display","none");
    }
    // if(updatedDiscount > 0) {
    //   updatedDiscount = Math.round(updatedDiscount * 100) / 100;
    //   $(".js-frequent-discount").html("$ " + updatedDiscount);
    // }

    $(".js-frequent-totalPrice").html("$ " + updatedTotal);

  })

});

function onVisibilityChange(el, callback) {
  var old_visible;
  return function () {
    var visible = isElementInViewport(el);
    // console.log(visible, "huh");
    if(visible == true && el === document.getElementsByClassName("frequently-boughtProducts-section")[0] && window.matchMedia("(max-width: 1024px)").matches) {
      $(".js-quantity-and-addToCart-container").css({"opacity":"0","z-index": "-1"});
    }
    else {
      $(".js-quantity-and-addToCart-container").css({"opacity":"1","z-index": "2"});

    }
    // if (visible != old_visible) {
    //     old_visible = visible;
    //     console.log("visible bitches!")
    //     if (typeof callback == 'function') {
    //       console.log(callback);
    //         callback();

    //     }
    // }
  }
}
if(document.getElementsByClassName("frequently-boughtProducts-section").length != 0) {
  var handler = onVisibilityChange(document.getElementsByClassName("frequently-boughtProducts-section")[0], addToCartVisibility);
  function addToCartVisibility() {
    /* your code go here */

  }
}


function isElementInViewport (el) {

  //special bonus for those using jQuery
  if (typeof jQuery === "function" && el instanceof jQuery) {
    el = el[0];
  }

  var rect = el.getBoundingClientRect();

  return rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */ &&
    rect.top < (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */;
}
// function isElementInViewport(el) {
//   var rect = el.getBoundingClientRect();

//   return rect.bottom > 0 &&
//       rect.right > 0 &&
//       rect.left < (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */ &&
//       rect.top < (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */;
// }


//jQuery
$(window).on('DOMContentLoaded load resize scroll', handler); 
// change product heading positioning in mobile
$(window).on("load ready resize", function() {
  // console.log("90");
  if(window.matchMedia("(max-width: 1024px)").matches) {
    // console.log("90")
    $(".js-product-heading").insertBefore($(".js-attach-heading"));
    // show daily deals

    // console.log($(".Linklist__Item h4").length);
    for(var i = 0; i < $(".Linklist__Item h4").length; i++) {
      if($(".Linklist__Item h4")[i].innerHTML=="Daily Deals") {
        // console.log('hide', typeof($(".Linklist__Item h4")[i].closest(".Linklist__Item")));
        $($(".Linklist__Item h4")[i].closest(".Linklist__Item")).css("display","block")
      }
      // console.log('hide');
    }
  }
  else {
    $(".js-product-heading").appendTo($(".js-heading-wrapper"));
    // hide daily deals

    // console.log($(".Linklist__Item h4").length);
    for(var i = 0; i < $(".Linklist__Item h4").length; i++) {
      if($(".Linklist__Item h4")[i].innerHTML=="Daily Deals") {
        // console.log('hide', typeof($(".Linklist__Item h4")[i].closest(".Linklist__Item")));
        $($(".Linklist__Item h4")[i].closest(".Linklist__Item")).css("display","none")
      }
      // console.log('hide');
    }
  }
  if(window.matchMedia("(max-width: 767px)").matches) {
    // console.log('<767');
    $('.image-zoom').trigger('zoom.destroy');
    $(".js-nav-search").insertAfter($("header#section-header"));
    $(".js-review-btns-container").insertAfter($(".js-full-underline--reviews"));
  }
  else {
    // console.log('>767');
    // console.log($(".image-zoom"));
    $('.image-zoom').trigger('zoom.destroy');
    $.each($(".image-zoom"), function(i, val) {
      // console.log(val, $(this), $(this).attr('data-zoom'));
      try{
        $(this).parent()
        .zoom({
          url: $(this).attr('data-zoom'),
          zoom: 2
        });
      }
      catch(e){}

    });
    $(".js-search-nav-container").append($(".js-nav-search"));
    $(".js-reviews-heading").append($(".js-review-btns-container"));
  }
});


// HOMEPAGE VIDEO FIX JS 03052020
// Find all YouTube videos
var $allVideos = $("iframe[src^='//player.vimeo.com'], iframe[src^='//www.youtube.com']"),

    // The element that is fluid width
    $fluidEl = $("body");

// Figure out and save aspect ratio for each video
$allVideos.each(function() {

  $(this)
  .data('aspectRatio', this.height / this.width)

  // and remove the hard coded width/height
  .removeAttr('height')
  .removeAttr('width');

});

// When the window is resized
$(window).resize(function() {

  var newWidth = $fluidEl.width();

  // Resize all videos according to their own aspect ratio
  $allVideos.each(function() {

    var $el = $(this);
    $el
    .width(newWidth)
    .height(newWidth * $el.data('aspectRatio'));

  });

  // Kick off one resize to fix all videos on page load
}).resize();

function handleResponsiveVimeoIframe() {
  const desktopIframe = document.querySelector('[data-vimeo-desktop]');
  const mobileIframe = document.querySelector('[data-vimeo-mobile]');
  let desktopVimeoPlayer;
  let mobileVimeoPlayer;

  if(desktopIframe) {
    desktopVimeoPlayer = new Vimeo.Player(desktopIframe);
  }

  if(mobileIframe) {
    mobileVimeoPlayer = new Vimeo.Player(mobileIframe);
  }

  if(window.innerWidth > 767) {
    if(mobileIframe) {
      mobileVimeoPlayer.getPaused().then(function(paused) {
        if(paused === false) {
          mobileVimeoPlayer.pause();
        }
      });
    }
  } else {
    if(desktopIframe && mobileIframe) {
      desktopVimeoPlayer.getPaused().then(function(paused) {
        if(paused === false) {
          desktopVimeoPlayer.pause();
        }
      });
    }
  }
}

const iframesContainer = document.querySelector('.embedded-iframe');
if(iframesContainer) {
  window.addEventListener('resize', handleResponsiveVimeoIframe);
  window.dispatchEvent(new Event('resize'));
}

// Accordion
var acc = document.getElementsByClassName("accordion");
var i;

if(acc) {
  for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }
}