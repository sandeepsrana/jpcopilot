from flask import Blueprint, Flask, render_template


page_bp = Blueprint("page", __name__)


@page_bp.route("/")
def index() -> str:
	return render_template("index.html")


def create_app() -> Flask:
	app = Flask(__name__, template_folder="templates", static_folder="static")
	app.register_blueprint(page_bp)
	return app


app = create_app()


if __name__ == "__main__":
	app.run(debug=True)
