use std::borrow::Cow;

use rand::{self, Rng};

use rocket::request::FromParam;

pub struct ShortId<'a>(Cow<'a, str>);

impl ShortId<'_> {
    pub fn new() -> ShortId<'static> {
        const BASE62: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        let mut id = String::with_capacity(9);
        let mut rng = rand::thread_rng();
        for _ in 0..9 {
            id.push(BASE62[rng.gen::<usize>() % 62] as char);
        }

        ShortId(Cow::Owned(id))
    }
}

impl<'a> FromParam<'a> for ShortId<'a> {
    type Error = &'a str;

    fn from_param(param: &'a str) -> Result<Self, Self::Error> {
        if param.len() != 9 {
            return Err(param);
        }

        param.chars().all(|c| c.is_ascii_alphanumeric())
            .then(|| ShortId(param.into()))
            .ok_or(param)
    }
}
