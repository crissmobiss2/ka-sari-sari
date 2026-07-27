-- Real bcrypt hashes for the seed demo accounts (local dev / load test)
UPDATE users SET password_hash = '$2b$10$6jr8x4Km3bWjtVuyZ.w64.GyCVwO4onavwgrscUCDdf/0vhqbiT2u' WHERE phone = '09171234567';
UPDATE users SET password_hash = '$2b$10$ejwTYfKzhjf31IduYy5DS.XGYVzaeHx.q3PEbPiKSBba5MPwqDV7a' WHERE phone = '09172345678';
UPDATE users SET password_hash = '$2b$10$wMOrkvJRBhQ5oDPR8Fliwuq0lZ882WpMYgcWUBAoRUe.MFKICQ5pO' WHERE phone = '09173456789';
UPDATE users SET password_hash = '$2b$10$9I.VTuNa3kOQFsGngHzjc.i91mBq5oVdfFUhg8KG3HNxcaDpyYmza' WHERE phone = '09181234567';
