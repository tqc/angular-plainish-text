angular.module("plainish-text", []).directive("plainishText", ["$parse"].concat([function ($parse) {
      return {
        scope: true,
        link: function($scope, $element, $attrs) {
          $element.attr("contenteditable", "true");
          var options = {allowedTags: "p,b,i,ul,ol,li"};
          if ($attrs.options) {
            $scope.$watch($attrs.options, function(o) {
              if (o) {
                options = angular.extend(options, o);
              }
            });
          }
          var getter = $parse($attrs.ngModel),
              setter = getter.assign;
          var storedHtml = "";
          var renderedHtml = "";
          var originalRenderedHtml = "";
          function convertStoredToRendered() {
            var result = storedHtml || "";
            if (result.indexOf("<") !== 0)
              result = "<p>" + result + "</p>";
            result = result.replace(/<annotation([^>]*)><\/annotation>/gi, "<img class=\"annotation\"$1>");
            result = result.replace(/<font([^>]*)>/gi, "").replace(/<\/font>/gi, "").replace(/&nbsp;/gi, " ").replace(/<div>/gi, "<p>").replace(/<\/div>/gi, "</p>");
            if (result != renderedHtml) {
              originalRenderedHtml = result;
              renderedHtml = result;
              $element.html(renderedHtml);
            }
          }
          function convertRenderedToStored() {
            if (renderedHtml == originalRenderedHtml)
              return ;
            var result = renderedHtml || "";
            result = result.replace(/<!--StartFragment-->/gi, "").replace(/<!--EndFragment-->/gi, "").replace(/\s+/g, " ").replace(/<br><\/p>/gi, "</p>").replace(/<p><\/p>/gi, "").replace(/<font([^>]*)>/gi, "").replace(/<\/font>/gi, "").replace(/<ul>\s*<\/ul>/gi, "").replace(/style="[^"]*"/gi, "").replace(/style='[^']*'/gi, "").trim();
            if (result != storedHtml) {
              storedHtml = result;
              originalRenderedHtml = renderedHtml;
              setter($scope, storedHtml);
              $scope.$apply();
            }
          }
          var setActiveEditor = $scope.$eval($attrs.setActiveEditor || "setActiveEditor");
          function getSelection() {
            var sel = window.getSelection();
            if (!sel.anchorNode)
              return null;
            var el = $(sel.anchorNode.parentElement);
            if (!el.attr("contenteditable"))
              el = el.closest("[contenteditable]");
            if (!el.length)
              return null;
            if (el[0] != $element[0])
              return null;
            return sel;
          }
          function selectionIsList() {
            var sel = window.getSelection();
            if (sel && sel.anchorNode) {
              var el = $(sel.anchorNode.parentElement);
              if (!el.attr("contenteditable"))
                el = el.closest("li,p,[contenteditable]");
              if (el.is("li"))
                return true;
            }
            return false;
          }
          var debounceTimer = 0;
          function handleChange() {
            renderedHtml = $element.html();
            convertRenderedToStored();
          }
          var isEmpty = false;
          var observer = new MutationObserver(function(mrl) {
            for (var i = 0; i < mrl.length; i++) {
              var mr = mrl[i];
              for (var j = 0; j < mr.addedNodes.length; j++) {
                var n = mr.addedNodes[j];
                if (n.tagName == "FONT") {
                  n.removeAttribute("color");
                  n.removeAttribute("size");
                  n.removeAttribute("face");
                }
                if (n.nodeType == Node.ELEMENT_NODE && n.hasAttribute("style")) {
                  n.removeAttribute("style");
                }
              }
            }
            if (isEmpty) {
              var h = $element.html();
              if (h && h.trim() && h.trim() != "<p></p>") {
                $element.removeClass("empty");
                isEmpty = false;
              }
            }
            window.clearTimeout(debounceTimer);
            debounceTimer = 0;
            debounceTimer = window.setTimeout(handleChange, 2000);
          });
          observer.observe($element[0], {
            childList: true,
            subtree: true,
            characterData: true
          });
          var editor = {
            selection: {
              isBold: false,
              isItalic: false,
              isUnderlined: false
            },
            moveLeft: function() {
              var sel = getSelection();
              if (!sel)
                return ;
              sel.modify("move", "left", "character");
            },
            moveRight: function() {
              var sel = getSelection();
              if (!sel)
                return ;
              sel.modify("move", "right", "character");
            },
            toggleBold: function() {
              var sel = getSelection();
              if (!sel)
                return ;
              document.execCommand("bold");
            },
            undo: function() {
              var sel = getSelection();
              if (!sel)
                return ;
              document.execCommand("undo");
            },
            redo: function() {
              var sel = getSelection();
              if (!sel)
                return ;
              document.execCommand("redo");
            },
            insert: function(html) {
              var sel = getSelection();
              if (!sel)
                return ;
              document.execCommand("insertHtml", null, html);
            }
          };
          $element.on("touchstart", function(e) {
            if ($(e.target).hasClass("annotation")) {
              $scope.editComment($(e.target).attr("commentid"), {element: $(e.target)});
              $scope.$apply();
            }
          });
          $element.on("keydown", function(e) {
            if (e.keyCode == 9) {
              if (e.shiftKey) {
                document.execCommand("outdent", false, "null");
              } else {
                var isList = selectionIsList();
                if (isList) {
                  document.execCommand("indent", false, "null");
                } else {
                  document.execCommand("insertUnorderedList", false, "null");
                }
              }
              e.preventDefault();
            }
          });
          $element.on("keypress", function(e) {
            if ((e.keyCode == '13' && !e.shiftKey) || isEmpty) {
              if (!selectionIsList()) {
                document.execCommand("formatBlock", false, "p");
              }
            }
          });
          function rem(root) {
            var $root = $(root);
            $root.contents().each(function() {
              if (this.nodeType === 1) {
                rem(this);
              } else if (this.nodeType == 8) {
                $(this).remove();
              }
            });
            if (!$root.is(options.allowedTags)) {
              $root.replaceWith(root.innerHTML);
            } else {
              var attributes = $.map(root.attributes, function(item) {
                return item.name;
              });
              $.each(attributes, function(i, item) {
                $root.removeAttr(item);
              });
            }
          }
          function pasteHandler(e) {
            e.preventDefault();
            var html = e.clipboardData.getData('text/html');
            if (html) {
              console.log(html);
              var b1 = html.indexOf("<body");
              var b2 = html.indexOf("</body>");
              if (b1 + b2 > 0)
                html = "<div" + html.substr(b1 + 5, b2 - b1 - 5) + "</div>";
              else
                html = "<div>" + html + "</div>";
              var stripper = $(html);
              rem(stripper);
              html = stripper.html();
              console.log("inserting");
              console.log(html);
              document.execCommand("insertHtml", false, html);
            } else {
              var text = e.clipboardData.getData('text/plain');
              if (text) {
                document.execCommand("insertText", false, text);
              }
            }
          }
          $element[0].addEventListener("paste", pasteHandler);
          $scope.$on('$destroy', function() {
            console.log("Destroying contenteditable scope");
          });
          $element.on("focus", function() {
            if (setActiveEditor)
              setActiveEditor(editor);
            editor.selection = {
              isBold: false,
              isItalic: false,
              isUnderlined: false,
              allowComments: $element.hasClass("allowcomments")
            };
            $scope.$apply();
          });
          $element.on("blur", function() {
            console.log("contenteditable field blurred");
            if (debounceTimer) {
              window.clearTimeout(debounceTimer);
              debounceTimer = 0;
              handleChange();
            }
            if (editor.selection)
              editor.selection.allowComments = false;
            $scope.$apply();
          });
          $scope.$watch($attrs.ngModel, function(newVal) {
            if (!newVal || newVal == "<p></p>") {
              isEmpty = true;
              $element.addClass("empty");
            } else {
              isEmpty = false;
              $element.removeClass("empty");
            }
            if (newVal == storedHtml) {
              return ;
            } else {
              storedHtml = newVal;
              convertStoredToRendered();
            }
          });
        }
      };
    }]))