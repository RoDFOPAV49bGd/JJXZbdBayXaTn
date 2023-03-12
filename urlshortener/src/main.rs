#[macro_use]
extern crate rocket;

mod short_id;

use rocket::response::{status::NotFound, Redirect};
use rocket::serde::{json::Json, Deserialize, Serialize};
use short_id::ShortId;
use std::env;

#[derive(Responder)]
enum ResponseGet {
    Redirect(Redirect),
    NotFound(NotFound<String>),
}

#[get("/<id>")]
async fn retrieve(id: ShortId<'_>) -> ResponseGet {
    let url = id.get_url().await.unwrap_or("".to_string());
    if url == "" {
        ResponseGet::NotFound(NotFound("".to_string()))
    } else {
        ResponseGet::Redirect(Redirect::to(url))
    }
}

#[derive(Deserialize)]
struct Url {
    url: String,
}

#[derive(Serialize)]
struct ResponseUrl {
    url: String,
    shortenUrl: String,
}

#[post("/newurl", data = "<url>")]
async fn create(url: Json<Url>) -> Json<ResponseUrl> {
    let url = url.url.clone();

    let id = ShortId::new().set_url(&url).await;

    Json(ResponseUrl {
        url: url,
        shortenUrl: format!(
            "{}/{}",
            env::var("DOMAIN").unwrap_or("https://shortenurl.org".to_string()),
            id.unwrap()
        ),
    })
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![create, retrieve])
}
