use aws_config::meta::region::RegionProviderChain;
use aws_sdk_dynamodb::model::AttributeValue;
use aws_sdk_dynamodb::{Client, Error};
use rand::{self, Rng};
use rocket::request::FromParam;
use std::borrow::Cow;

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

    pub async fn set_url(&self, url: &str) -> Result<String, Error> {
        let region_provider = RegionProviderChain::default_provider().or_else("us-east-1");
        let config = aws_config::from_env().region(region_provider).load().await;

        let client = Client::new(&config);

        let shortid_av = AttributeValue::S(self.0.to_string());
        let url_av = AttributeValue::S(url.to_string());

        client
            .put_item()
            .table_name("test")
            .item("shortid", shortid_av)
            .item("url", url_av)
            .send()
            .await?;

        Ok(self.0.to_string())
    }

    pub async fn get_url(&self) -> Result<String, Error> {
        let region_provider = RegionProviderChain::default_provider().or_else("us-east-1");
        let config = aws_config::from_env().region(region_provider).load().await;

        let client = Client::new(&config);

        let items = client
            .query()
            .table_name("test")
            .key_condition_expression("shortid = :shortid")
            .expression_attribute_values(":shortid", AttributeValue::S(self.0.to_string()))
            .send()
            .await?
            .items
            .unwrap();

        match items.first() {
            Some(m) => Ok(m.get("url").unwrap().as_s().unwrap().clone()),
            _ => Ok("".to_string()),
        }
    }
}

impl<'a> FromParam<'a> for ShortId<'a> {
    type Error = &'a str;

    fn from_param(param: &'a str) -> Result<Self, Self::Error> {
        if param.len() != 9 {
            return Err(param);
        }

        param
            .chars()
            .all(|c| c.is_ascii_alphanumeric())
            .then(|| ShortId(param.into()))
            .ok_or(param)
    }
}
