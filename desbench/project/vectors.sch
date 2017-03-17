; Vector support

(define (permute-vec permutation source)
  (let* ((l (vector-length permutation))
	 (v (make-vector l 0)))
    (do ((i 0 (+ i 1)))
	((= i l) v)
      (vector-set! v i (vector-ref source (vector-ref permutation i))))))

(define (xor-vec a b)
  (let* ((l (vector-length a))
	 (v (make-vector l 0)))
    (do ((i 0 (+ i 1)))
	((= i l) v)
      (vector-set! v i (if (= (vector-ref a i) (vector-ref b i)) 0 1)))))

(define (xor-vec! a b)
  (let* ((l (vector-length a)))
    (do ((i 0 (+ i 1)))
	((= i l) a)
      (vector-set! a i (if (= (vector-ref a i) (vector-ref b i)) 0 1)))))

; If bits is greater than the length of the vector, then the vector is
; left-aligned in the new vector before shifting!

(define (shr-vec v n . rest)
  (let ((bits (if (null? rest) (vector-length v) (car rest))))
    (let ((w (make-vector bits 0)))
      (do ((i 0 (+ i 1))
	   (j n (+ j 1)))
	  ((or (= i (vector-length v))
	       (= j (vector-length w)))
	   w)
	(vector-set! w j (vector-ref v i))))))

; Vector is right-aligned in new vector before shifting.

(define (shl-vec v n . rest)
  (let ((bits (if (null? rest) (vector-length v) (car rest))))
    (let ((w (make-vector bits 0)))
      (do ((i (- (vector-length v) 1) (- i 1))
	   (j (- bits n 1) (- j 1)))
	  ((or (< i 0)
	       (< j 0))
	   w)
	(vector-set! w j (vector-ref v i))))))

; This strange definition aids debugging.

(define (and-vec a b)
  (let ((v (make-vector (vector-length a) 0)))
    (do ((i 0 (+ i 1)))
	((= i (vector-length a)) v)
      (vector-set! v i (if (and (not (zero? (vector-ref a i)))
				(not (zero? (vector-ref b i))))
			   (max (vector-ref a i) (vector-ref b i))
			   0)))))

(define (or-vec a . rest)
  (let ((v (vector-copy a)))

    (define (or-vector a)
      (do ((i 0 (+ i 1)))
	  ((= i (vector-length a)))
	(vector-set! v i (if (or (not (zero? (vector-ref a i)))
				 (not (zero? (vector-ref v i))))
			     (max (vector-ref a i) (vector-ref v i))
			     0))))

    (let loop ((rest rest))
      (if (null? rest)
	  v
	  (begin (or-vector (car rest))
		 (loop (cdr rest)))))))

(define (or-vec! a b)
  (do ((i 0 (+ i 1)))
      ((= i (vector-length a)) a)
    (vector-set! a i (if (or (not (zero? (vector-ref a i)))
			     (not (zero? (vector-ref b i))))
			 (max (vector-ref a i) (vector-ref b i))
			 0))))

(define make-bitvector make-vector)

(define (adjust-right v bits)
  (let ((w (make-vector bits 0))
	(l (vector-length v)))
    (do ((l (- l 1) (- l 1))
	 (d (- bits 1) (- d 1)))
	((< l 0) w)
      (vector-set! w d (vector-ref v l)))))

(define (trunc-vec v n)
  (let ((w (make-vector n 0))
	(l (vector-length v)))
    (do ((n (- n 1) (- n 1))
	 (i (- l 1) (- i 1)))
	((< n 0) w)
      (vector-set! w n (vector-ref v i)))))

(define (append-vec a b)
  (let* ((l1 (vector-length a))
	 (l2 (vector-length b))
	 (k  (+ l1 l2))
	 (v  (make-vector k 0)))
    (do ((i 0 (+ i 1)))
	((= i l1))
      (vector-set! v i (vector-ref a i)))
    (do ((i 0 (+ i 1))
	 (j l1 (+ j 1)))
	((= i l2) v)
      (vector-set! v j (vector-ref b i)))))

(define (split-vec v k)
  (let* ((l (vector-length v))
	 (v1 (make-vector k 0))
	 (v2 (make-vector (- l k) 0)))
    (do ((i 0 (+ i 1)))
	((= i k))
      (vector-set! v1 i (vector-ref v i)))
    (do ((i k (+ i 1))
	 (j 0 (+ j 1)))
	((= i l) (cons v1 v2))
      (vector-set! v2 j (vector-ref v i)))))

(define (subvector v start end)
  (let ((w (make-vector (- end start))))
    (do ((i start (+ i 1))
	 (j 0 (+ j 1)))
	((= i end) w)
      (vector-set! w j (vector-ref v i)))))