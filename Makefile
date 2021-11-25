all: notes.html

%.html : %.md
	cat $< | markdown2html > $@

