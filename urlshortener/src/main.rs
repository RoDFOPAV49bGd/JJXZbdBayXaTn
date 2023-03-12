#[macro_use]
extern crate rocket;

mod short_id;

use rocket::response::{status::NotFound, Redirect};
use rocket::serde::{Serialize, json::Json, Deserialize};
use short_id::ShortId;

#[derive(Responder)]
enum MyResponse {
    Redirect(Redirect),
    NotFound(NotFound<String>),
}

#[get("/<id>")]
async fn retrieve(id: ShortId<'_>) -> MyResponse {
    let url = id.get_url().await.unwrap_or("".to_string());
    if url == "" {
        return MyResponse::NotFound(NotFound("".to_string()));
    } else {
        return MyResponse::Redirect(Redirect::to(url));
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

#[post("/newurl", data = "<u>")]
async fn create(u: Json<Url>) -> Json<ResponseUrl> {
    let url = u.url.clone();

    let id = ShortId::new().set_url(&url).await;

    Json(ResponseUrl{url: url, shortenUrl: id.unwrap()})
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![create, retrieve])
}
