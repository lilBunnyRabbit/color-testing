import { StreamLanguage, type StreamParser } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const CONSTRUCTORS = new Set(['HSL', 'RGB', 'OKLCH']);
const BUILTINS = new Set(['hex', 'mix', 'contrast', 'clamp', 'abs', 'min', 'max', 'round', 'floor', 'ceil']);
const METHODS = new Set([
	'lighten', 'darken', 'saturate', 'desaturate', 'rotate',
	'invert', 'complement', 'mix', 'shift', 'derive', 'contrast'
]);
const PROPERTIES = new Set([
	'ok_l', 'ok_c', 'ok_h',
	'h', 's', 'l', 'r', 'g', 'b',
	'hex', 'inGamut', 'inP3', 'gamutMapped'
]);

interface State {
	afterDot: boolean;
}

const parser: StreamParser<State> = {
	startState(): State {
		return { afterDot: false };
	},

	token(stream, state): string | null {
		// Whitespace
		if (stream.eatSpace()) {
			state.afterDot = false;
			return null;
		}

		// Comments
		if (stream.match('//')) {
			stream.skipToEnd();
			return tags.lineComment.toString();
		}

		// Strings
		if (stream.match(/"[^"]*"/) || stream.match(/'[^']*'/)) {
			state.afterDot = false;
			return tags.string.toString();
		}

		// Numbers
		if (stream.match(/^-?\d+\.?\d*/)) {
			state.afterDot = false;
			return tags.number.toString();
		}

		// Dot
		if (stream.eat('.')) {
			state.afterDot = true;
			return tags.punctuation.toString();
		}

		// Identifiers / keywords
		const wordMatch = stream.match(/^[a-zA-Z_]\w*/);
		if (wordMatch) {
			const word = typeof wordMatch === 'boolean' ? '' : wordMatch[0];

			if (state.afterDot) {
				state.afterDot = false;
				// Check if followed by ( to distinguish method from property
				if (stream.peek() === '(') {
					if (METHODS.has(word)) return tags.function(tags.propertyName).toString();
					return tags.function(tags.propertyName).toString();
				}
				if (PROPERTIES.has(word)) return tags.propertyName.toString();
				return tags.propertyName.toString();
			}

			state.afterDot = false;

			if (CONSTRUCTORS.has(word)) return tags.typeName.toString();
			if (BUILTINS.has(word)) return tags.function(tags.variableName).toString();
			if (word === 'true' || word === 'false') return tags.bool.toString();

			// Check if this is an assignment target (identifier followed by =)
			// We just color all identifiers as variable names
			return tags.variableName.toString();
		}

		// Operators
		if (stream.match(/^[+\-*/%=<>!&|?:]+/)) {
			state.afterDot = false;
			return tags.operator.toString();
		}

		// Parens / brackets
		if (stream.match(/^[(){}[\],]/)) {
			state.afterDot = false;
			return tags.punctuation.toString();
		}

		// Skip unknown
		stream.next();
		state.afterDot = false;
		return null;
	}
};

export const chromaDSL = StreamLanguage.define(parser);
