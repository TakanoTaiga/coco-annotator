<script>
import paper from "paper";
import tool from "@/mixins/toolBar/tool";

import { invertColor } from "@/libs/colors";
import { BBox } from "@/libs/bbox";
import { mapMutations } from "vuex";

export default {
  name: "BBoxTool",
  mixins: [tool],
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    settings: {
      type: [Object, null],
      default: null,
    },
  },
  data() {
    return {
      icon: "fa-object-group",
      name: "BBox",
      scaleFactor: 3,
      cursor: "copy",
      bbox: null,
      polygon: {
        path: null,
        guidance: true,
        pathOptions: {
          strokeColor: "black",
          strokeWidth: 1,
        },
      },
      color: {
        blackOrWhite: true,
        auto: true,
        radius: 10,
        circle: null,
      },
      actionTypes: Object.freeze({
        ADD_POINTS: "Added Points",
        CLOSED_POLYGON: "Closed Polygon",
        DELETE_POLYGON: "Delete Polygon",
      }),
      actionPoints: 0,
    };
  },
  methods: {
    ...mapMutations(["addUndo", "removeUndos"]),
    export() {
      return {
        completeDistance: this.polygon.completeDistance,
        minDistance: this.polygon.minDistance,
        blackOrWhite: this.color.blackOrWhite,
        auto: this.color.auto,
        radius: this.color.radius,
      };
    },
    setPreferences(pref) {
      this.color.blackOrWhite = pref.blackOrWhite || this.color.blackOrWhite;
      this.color.auto = pref.auto || this.color.auto;
      this.color.radius = pref.radius || this.color.radius;
    },
    createBBox(event) {
      this.polygon.path = new paper.Path(this.polygon.pathOptions);
      this.bbox = new BBox(event.point);
      this.bbox.getPoints().forEach((point) => this.polygon.path.add(point));
    },

    modifyBBox(event) {
      this.polygon.path = new paper.Path(this.polygon.pathOptions);
      this.bbox.modifyPoint(event.point);
      this.bbox.getPoints().forEach((point) => this.polygon.path.add(point));
    },
    /**
     * Frees current bbox
     */
    deleteBbox() {
      if (this.polygon.path == null) return;

      this.polygon.path.remove();
      this.polygon.path = null;

      if (this.color.circle == null) return;
      this.color.circle.remove();
      this.color.circle = null;
    },
    autoStrokeColor(point) {
      if (this.color.circle == null) return;
      if (this.polygon.path == null) return;
      if (!this.color.auto) return;

      this.color.circle.position = point;
      let raster = this.$parent.image.raster;
      let color = raster.getAverageColor(this.color.circle);
      if (color) {
        this.polygon.pathOptions.strokeColor = invertColor(
          color.toCSS(true),
          this.color.blackOrWhite
        );
      }
    },
    checkAnnotationExist() {
      return (
        !!this.$parent.currentAnnotation &&
        !!this.$parent.currentAnnotation.annotation.paper_object.length
      );
    },
    onMouseDown(event) {
      if (this.polygon.path == null && this.checkAnnotationExist()) {
        this.$parent.currentCategory.createAnnotation();
      }
      if (this.polygon.path == null) {
        this.createBBox(event);
        return;
      }
      this.removeLastBBox();
      this.modifyBBox(event);

      if (this.completeBBox()) return;
    },
    onMouseMove(event) {
      if (this.polygon.path == null) return;
      if (this.polygon.path.segments.length === 0) return;
      this.autoStrokeColor(event.point);

      this.removeLastBBox();
      this.modifyBBox(event);
    },
    /**
     * Undo points
     */
    undoPoints(args) {
      if (this.polygon.path == null) return;

      let points = args.points;
      let length = this.polygon.path.segments.length;

      this.polygon.path.removeSegments(length - points, length);
    },
    /**
     * Closes current polygon and unites it with current annotaiton.
     * @returns {boolean} sucessfully closes object
     */
    completeBBox() {
      if (this.polygon.path == null) return false;

      this.polygon.path.fillColor = "black";
      this.polygon.path.closePath();

      this.$parent.uniteCurrentAnnotation(this.polygon.path, true, true, true);

      this.polygon.path.remove();
      this.polygon.path = null;
      if (this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }

      this.removeUndos(this.actionTypes.ADD_POINTS);

      return true;
    },
    removeLastBBox() {
      this.polygon.path.removeSegments();
    },
  },
  computed: {
    isDisabled() {
      return this.$parent.current.annotation === -1;
    },
  },
  watch: {
    isActive(active) {
      if (active) {
        this.tool.activate();
        localStorage.setItem("editorTool", this.name);
      }
    },
    /**
     * Change width of stroke based on zoom of image
     */
    scale(newScale) {
      this.polygon.pathOptions.strokeWidth = newScale * this.scaleFactor;
      if (this.polygon.path != null)
        this.polygon.path.strokeWidth = newScale * this.scaleFactor;
    },
    "polygon.pathOptions.strokeColor"(newColor) {
      if (this.polygon.path == null) return;

      this.polygon.path.strokeColor = newColor;
    },
    "color.auto"(value) {
      if (value && this.polygon.path) {
        this.color.circle = new paper.Path.Rectangle(
          new paper.Point(0, 0),
          new paper.Size(10, 10)
        );
      }
      if (!value && this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }
    },
  },
  created() {},
  mounted() {},
};
</script>
