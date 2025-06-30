use axum::{
    routing::get,
    extract::Query,
    response::Json,
    Router,

};

use serde::Deserialize;
use chrono::{Utc, TimeZone};
use tfhe::boolean::{gen_keys, ciphertext::Ciphertext};
use tfhe::boolean::client_key::ClientKey;
use tfhe::boolean::server_key::ServerKey;
use std::sync::{Arc, Mutex};
use std::net::SocketAddr;
use hyper::Server;

#[derive(Deserialize)]
struct TimeoutCheckParams {
    last_ping: i64,     // from contract
    timeout_secs: i64,  // from contract
}

async fn check_timeout(Query(params): Query<TimeoutCheckParams>) -> Json<bool> {
    let now = Utc::now();
    let last_ping_time = Utc.timestamp_opt(params.last_ping, 0).unwrap();
    let passed = now.signed_duration_since(last_ping_time).num_seconds() > params.timeout_secs;

    Json(passed)
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/check_timeout", get(check_timeout));
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("TFHE API running at http://{}", addr);
    Server::bind(&addr)
    .serve(app.into_make_service())
        .await
        .unwrap();
}
