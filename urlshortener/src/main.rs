#[macro_use] extern crate rocket;

mod short_id;

use short_id::ShortId;

#[get("/<id>")]
async fn retrieve(id: ShortId<'_>) -> &'static str {
    "Test"
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![retrieve])
}
