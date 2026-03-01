import crypto from "crypto";

export function hashSecret(value) {
	return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function compareHashedSecret(rawValue, hashedValue) {
	if (!rawValue || !hashedValue) {
		return false;
	}

	const rawHash = hashSecret(rawValue);
	const left = Buffer.from(rawHash, "utf8");
	const right = Buffer.from(String(hashedValue), "utf8");

	if (left.length !== right.length) {
		return false;
	}

	return crypto.timingSafeEqual(left, right);
}

export function generateDeviceToken() {
	return crypto.randomBytes(24).toString("hex");
}
