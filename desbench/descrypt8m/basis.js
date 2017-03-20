// Miscellaneous procedures for dealing with analysis of DES

function zero_based(l) {
    return l.map((p) => p-1);
}

assertSame(zero_based([1,2,3,4]), [0,1,2,3]);

// Given some Num n or integer, break it into a list of k bits.  LSB comes last.

function bits(n, k) {
    let v = make_Array(k, 0);
    if (typeof n == "number") {
	for ( let i=0 ; i < k ; i++ ) {
	    v[k-i-1] = n & 1;
	    n >>>= 1;
	}
    } else {
	assert(n instanceof Num, "Input should be a Num: " + n);
	let z = n.bits;
	for ( let i=0 ; i < k ; i++ )
	    v[k-i-1] = z[i];
    }
    return v;
}

// Given a vector of bits, LSB last, return a Num (always).

function unbits(bits) {
    let v = make_Array(64, 0);
    let l = bits.length;
    for ( let i=0 ; i < l ; i++ )
	v[i] = bits[l-i-1];
    return new Num(v);
}

function iota(n) {
    return make_Array(n, (i) => i);
}

assertSame(iota(3), [0,1,2]);

function iota1(n) {
    return make_Array(n, (i) => i+1);
}

assertSame(iota1(3), [1,2,3]);

// Permutation and extraction vectors; S-boxes; key schedule.
// The permutation and extraction vectors all use 1-based indices, as does
// the key schedule.
//
// From Stinson, p.73-76

// Initial permutation

var ip_m =
    [58, 50, 42, 34, 26, 18, 10, 2,
     60, 52, 44, 36, 28, 20, 12, 4,
     62, 54, 46, 38, 30, 22, 14, 6,
     64, 56, 48, 40, 32, 24, 16, 8,
     57, 49, 41, 33, 25, 17,  9, 1,
     59, 51, 43, 35, 27, 19, 11, 3,
     61, 53, 45, 37, 29, 21, 13, 5,
     63, 55, 47, 39, 31, 23, 15, 7];

// Final permutation

var ip_inverse_m =
    [40, 8, 48, 16, 56, 24, 64, 32,
     39, 7, 47, 15, 55, 23, 63, 31,
     38, 6, 46, 14, 54, 22, 62, 30,
     37, 5, 45, 13, 53, 21, 61, 29,
     36, 4, 44, 12, 52, 20, 60, 28,
     35, 3, 43, 11, 51, 19, 59, 27,
     34, 2, 42, 10, 50, 18, 58, 26,
     33, 1, 41 , 9, 49, 17, 57, 25];

// Expansion function used on message: 48 bits.

var e_m =
    [32,  1,  2,  3,  4,  5,
      4,  5,  6,  7,  8,  9,
      8,  9, 10, 11, 12, 13,
     12, 13, 14, 15, 16, 17,
     16, 17, 18, 19, 20, 21,
     20, 21, 22, 23, 24, 25,
     24, 25, 26, 27, 28, 29,
     28, 29, 30, 31, 32,  1];

// Final permutation in the computation of f().

var p_m =
  [16,  7, 20, 21,
   29, 12, 28, 17,
    1, 15, 23, 26,
    5, 18, 31, 10,
    2,  8, 24, 14,
   32, 27,  3,  9,
   19, 13, 30,  6,
   22, 11,  4, 25];

// S-boxes

var s_boxes =
    [[[14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
      [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
      [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
      [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]],

     [[15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
      [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
      [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
      [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]],

     [[10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
      [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
      [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
      [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]],

     [[7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
      [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
      [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
      [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]],

     [[2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
      [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
      [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
      [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]],

     [[12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
      [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
      [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
      [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]],

     [[4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
      [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
      [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
      [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]],

     [[13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
      [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
      [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
      [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]]];

// Permuation matrices for key schedule computation.
// Initial permutation of key -- 56 bits.

var pc_1_m =
    [57, 49, 41, 33, 25, 17, 9,
      1, 58, 50, 42, 34, 26, 18,
     10, 2, 59, 51, 43, 35, 27,
     19, 11, 3, 60, 52, 44, 36,
     63, 55, 47, 39, 31, 23, 15,
     7, 62, 54, 46, 38, 30, 22,
     14, 6, 61, 53, 45, 37, 29,
     21, 13, 5, 28, 20, 12, 4];

// Permutation of each selection of bits in key computation -- 48 bits.

var pc_2_m =
  [14, 17, 11, 24,  1,  5,
     3, 28, 15,  6, 21, 10,
    23, 19, 12,  4, 26,  8,
    16,  7, 27, 20, 13,  2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32];

// Key schedule: also 1-based.
// This is machine-generated.

var key_schedule =
  [[10, 51, 34, 60, 49, 17, 33, 57, 2, 9, 19, 42, 3, 35, 26, 25, 44, 58, 59, 1, 36, 27, 18, 41, 22,
     28, 39, 54, 37, 4, 47, 30, 5, 53, 23, 29, 61, 21, 38, 63, 15, 20, 45, 14, 13, 62, 55, 31],
    [2, 43, 26, 52, 41, 9, 25, 49, 59, 1, 11, 34, 60, 27, 18, 17, 36, 50, 51, 58, 57, 19, 10, 33, 14,
     20, 31, 46, 29, 63, 39, 22, 28, 45, 15, 21, 53, 13, 30, 55, 7, 12, 37, 6, 5, 54, 47, 23],
    [51, 27, 10, 36, 25, 58, 9, 33, 43, 50, 60, 18, 44, 11, 2, 1, 49, 34, 35, 42, 41, 3, 59, 17, 61,
     4, 15, 30, 13, 47, 23, 6, 12, 29, 62, 5, 37, 28, 14, 39, 54, 63, 21, 53, 20, 38, 31, 7],
    [35, 11, 59, 49, 9, 42, 58, 17, 27, 34, 44, 2, 57, 60, 51, 50, 33, 18, 19, 26, 25, 52, 43, 1, 45,
     55, 62, 14, 28, 31, 7, 53, 63, 13, 46, 20, 21, 12, 61, 23, 38, 47, 5, 37, 4, 22, 15, 54],
    [19, 60, 43, 33, 58, 26, 42, 1, 11, 18, 57, 51, 41, 44, 35, 34, 17, 2, 3, 10, 9, 36, 27, 50, 29,
     39, 46, 61, 12, 15, 54, 37, 47, 28, 30, 4, 5, 63, 45, 7, 22, 31, 20, 21, 55, 6, 62, 38],
    [3, 44, 27, 17, 42, 10, 26, 50, 60, 2, 41, 35, 25, 57, 19, 18, 1, 51, 52, 59, 58, 49, 11, 34, 13,
     23, 30, 45, 63, 62, 38, 21, 31, 12, 14, 55, 20, 47, 29, 54, 6, 15, 4, 5, 39, 53, 46, 22],
    [52, 57, 11, 1, 26, 59, 10, 34, 44, 51, 25, 19, 9, 41, 3, 2, 50, 35, 36, 43, 42, 33, 60, 18, 28,
     7, 14, 29, 47, 46, 22, 5, 15, 63, 61, 39, 4, 31, 13, 38, 53, 62, 55, 20, 23, 37, 30, 6],
    [36, 41, 60, 50, 10, 43, 59, 18, 57, 35, 9, 3, 58, 25, 52, 51, 34, 19, 49, 27, 26, 17, 44, 2, 12,
     54, 61, 13, 31, 30, 6, 20, 62, 47, 45, 23, 55, 15, 28, 22, 37, 46, 39, 4, 7, 21, 14, 53],
    [57, 33, 52, 42, 2, 35, 51, 10, 49, 27, 1, 60, 50, 17, 44, 43, 26, 11, 41, 19, 18, 9, 36, 59, 4,
     46, 53, 5, 23, 22, 61, 12, 54, 39, 37, 15, 47, 7, 20, 14, 29, 38, 31, 63, 62, 13, 6, 45],
    [41, 17, 36, 26, 51, 19, 35, 59, 33, 11, 50, 44, 34, 1, 57, 27, 10, 60, 25, 3, 2, 58, 49, 43, 55,
     30, 37, 20, 7, 6, 45, 63, 38, 23, 21, 62, 31, 54, 4, 61, 13, 22, 15, 47, 46, 28, 53, 29],
    [25, 1, 49, 10, 35, 3, 19, 43, 17, 60, 34, 57, 18, 50, 41, 11, 59, 44, 9, 52, 51, 42, 33, 27, 39,
     14, 21, 4, 54, 53, 29, 47, 22, 7, 5, 46, 15, 38, 55, 45, 28, 6, 62, 31, 30, 12, 37, 13],
    [9, 50, 33, 59, 19, 52, 3, 27, 1, 44, 18, 41, 2, 34, 25, 60, 43, 57, 58, 36, 35, 26, 17, 11, 23, 61,
     5, 55, 38, 37, 13, 31, 6, 54, 20, 30, 62, 22, 39, 29, 12, 53, 46, 15, 14, 63, 21, 28],
    [58, 34, 17, 43, 3, 36, 52, 11, 50, 57, 2, 25, 51, 18, 9, 44, 27, 41, 42, 49, 19, 10, 1, 60, 7, 45,
     20, 39, 22, 21, 28, 15, 53, 38, 4, 14, 46, 6, 23, 13, 63, 37, 30, 62, 61, 47, 5, 12],
    [42, 18, 1, 27, 52, 49, 36, 60, 34, 41, 51, 9, 35, 2, 58, 57, 11, 25, 26, 33, 3, 59, 50, 44, 54,
     29, 4, 23, 6, 5, 12, 62, 37, 22, 55, 61, 30, 53, 7, 28, 47, 21, 14, 46, 45, 31, 20, 63],
    [26, 2, 50, 11, 36, 33, 49, 44, 18, 25, 35, 58, 19, 51, 42, 41, 60, 9, 10, 17, 52, 43, 34, 57,
     38, 13, 55, 7, 53, 20, 63, 46, 21, 6, 39, 45, 14, 37, 54, 12, 31, 5, 61, 30, 29, 15, 4, 47],
    [18, 59, 42, 3, 57, 25, 41, 36, 10, 17, 27, 50, 11, 43, 34, 33, 52, 1, 2, 9, 44, 35, 26, 49, 30,
     5, 47, 62, 45, 12, 55, 38, 13, 61, 31, 37, 6, 29, 46, 4, 23, 28, 53, 22, 21, 7, 63, 39]];

