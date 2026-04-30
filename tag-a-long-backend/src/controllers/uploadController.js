const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No image provided' },
      });
    }

    const bucket = req.body.bucket || 'profile-photos';
    const userId = req.user.id;
    const file = req.file;

    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    res.json({ success: true, data: { url: urlData.publicUrl } });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage };
