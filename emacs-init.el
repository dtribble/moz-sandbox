
(setq auto-mode-alist
      (cons '("\\.cf\\'" . java-mode)
	    auto-mode-alist))

(defvar c-default-style
  '((c-mode . "stroustrup")
    (c++-mode . "stroustrup")
    (java-mode . "java")))

(add-hook 'java-mode-hook
	  (lambda ()
	    (set-variable 'c-basic-offset 4)))

(add-hook 'c-mode-hook
	  (lambda ()
	    (set-variable 'show-trailing-whitespace t)))

(add-hook 'c++-mode-hook
	  (lambda ()
	    (set-variable 'show-trailing-whitespace t)))

; Belt and suspenders on this one

(eval-after-load "vc" '(remove-hook 'find-file-hooks 'vc-find-file-hook))
(remove-hook 'find-file-hooks 'vc-find-file-hook)

; Source grep

; TODO: must include the js/public directory also
; TODO: would be helpful for files to be sorted by basename first, extension last
; TODO: might be useful for *sgrep-dir* to be derived from the name of the file in the current buffer,
;       and only fall back to the predefined value if that fails.

(defvar *sgrep-dir* "/home/lth/moz/mozilla-inbound/js/src")
(defvar *sgrep-files* "*.h *.c *.cpp *.js")

(defun sgrep (pattern)
  "Recursive grep across *sgrep-files* within *sgrep-dir*."
  (interactive 
   (progn
     (grep-compute-defaults)		; A hack - forces grep to be loaded
     (list (let* ((def (current-word))
		  (prompt (if (null def)
			      "Find: "
			    (concat "Find (default " def "): "))))
	     (read-string prompt nil nil def)))))
  (rgrep pattern *sgrep-files* *sgrep-dir*))